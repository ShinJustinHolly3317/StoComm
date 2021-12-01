// Require mysql connection
const db = require('./config/mysqlConnection')
const moment = require('moment')

async function createIdeas(ideasData) {
  try {
    const [stockIdResult] = await db.query(
      'SELECT * FROM stock WHERE stock_code = ?',
      [ideasData.stock_code]
    )

    ideasData.stock_id = stockIdResult[0].stock_id
    ideasData.date = moment().format('YYYY-MM-DD')
    delete ideasData['stock_code']

    await db.query('INSERT INTO ideas SET ?', [ideasData])

    return { message: 'success' }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getIdeas(userId, page) {
  const getQry = `
  SELECT ideas.*, user.name AS user_name, user.picture AS user_picture, stock.stock_code AS stock_code, stock.company_name AS company_name, sum(idea_likes.likes_num) AS total_likes
  FROM ideas
  INNER JOIN user ON user.id = ideas.user_id
  INNER JOIN stock ON stock.stock_id = ideas.stock_id
  LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
  WHERE user.id = ?
  GROUP BY ideas.id
  ORDER BY ideas.date DESC
  LIMIT 10 OFFSET ?
  `
  const countQry = `
    SELECT COUNT(*) AS total FROM ideas WHERE user_id = ?
  `

  const offset = page ? page * 10 : 0
  try {
    const [result] = await db.query(getQry, [userId, offset])
    const countResult = await db.query(countQry, [userId])
    return { data: result, totalCount: countResult[0][0].total }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getIdea(ideaId) {
  const getQry = `
    SELECT ideas.*, user.name AS user_name, user.picture AS user_picture,stock.stock_code as stock_code, stock.company_name AS company_name
    FROM ideas
    INNER JOIN user ON user.id = ideas.user_id
    INNER JOIN stock ON stock.stock_id = ideas.stock_id
    WHERE ideas.id = ?
  `
  try {
    const [result] = await db.query(getQry, [ideaId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getHotIdeas(filter, page, condition = {}) {
  let getQry
  let countQry

  try {
    switch (filter) {
      case 'time': {
        getQry = `
        SELECT ideas.*, user.name AS user_name, user.picture AS user_picture, stock.stock_code AS stock_code, stock.company_name AS company_name, SUM(idea_likes.likes_num) AS total_likes
        FROM ideas
        INNER JOIN user ON user.id = ideas.user_id
        INNER JOIN stock ON stock.stock_id = ideas.stock_id
        LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY ideas.date DESC
        LIMIT 10 OFFSET ?
        `
        break
      }
      case 'followers': {
        getQry = `
        SELECT ideas.*, user.name AS user_name, user.picture AS user_picture, stock.stock_code AS stock_code, stock.company_name AS company_name, COUNT(follow_status.following_id) AS followers, total_likes
        FROM ideas
        INNER JOIN follow_status ON follow_status.following_id = ideas.user_id
        INNER JOIN user ON user.id = ideas.user_id
        INNER JOIN stock ON stock.stock_id = ideas.stock_id
        LEFT JOIN (select idea_id, SUM(idea_likes.likes_num) AS total_likes from idea_likes group by idea_likes.idea_id) AS idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY followers DESC
        LIMIT 10 OFFSET ?
        `
        break
      }
      case 'likes': {
        getQry = `
        SELECT ideas.*, user.name AS user_name, user.picture AS user_picture, stock.stock_code AS stock_code, stock.company_name AS company_name, SUM(idea_likes.likes_num) AS total_likes
        FROM ideas
        INNER JOIN user ON user.id = ideas.user_id
        INNER JOIN stock ON stock.stock_id = ideas.stock_id 
        LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY total_likes DESC
        LIMIT 10 OFFSET ?
        `
        break
      }
      case 'byFollowing': {
        getQry = `
        SELECT ideas.*, user.name AS user_name, user.picture AS user_picture, stock.stock_code AS stock_code, stock.company_name AS company_name, SUM(idea_likes.likes_num) AS total_likes
        FROM ideas
        INNER JOIN stock ON stock.stock_id = ideas.stock_id
        INNER JOIN (SELECT follow_status.following_id AS following_id FROM follow_status WHERE follow_status.user_id = ?) AS follow_status ON follow_status.following_id = ideas.user_id
        INNER JOIN user ON user.id = ideas.user_id
        LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY ideas.date DESC
        LIMIT 10 OFFSET ?
        `
        break
      }
    }

    const userId = condition.userId || null
    const offset = page ? page * 10 : 0
    let binding
    if (filter !== 'byFollowing') {
      countQry = `
        SELECT COUNT(*) AS total FROM ideas;
      `
      binding = [offset]
    } else {
      countQry = `
        SELECT COUNT(*) AS total FROM ideas 
        INNER JOIN (SELECT follow_status.following_id AS following_id FROM follow_status WHERE follow_status.user_id = ?) AS follow_status ON follow_status.following_id = ideas.user_id
      `
      binding = [userId, offset]
    }

    const [result] = await db.query(getQry, binding)
    const [countResult] = await db.query(countQry, userId)
    const totalCount = countResult[0].total

    return { result, totalCount }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function addLikes(userId, ideaId) {
  const searchLikes = `
  SELECT * FROM idea_likes 
  WHERE user_id = ?
  AND idea_id = ?
  `
  const createLike = `
  INSERT INTO idea_likes (user_id, idea_id, likes_num)
  VALUES ?
  `
  const addLike = `
  UPDATE idea_likes SET likes_num = likes_num + 1 
  WHERE user_id = ?
  AND idea_id = ?
  `

  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const [likesResult] = await conn.query(searchLikes, [userId, ideaId])

    if (likesResult.length) {
      const totalLikes = likesResult[0].likes_num

      if (totalLikes >= 10) {
        // like max is 30
        await conn.query('ROLLBACK')
        return { overlimit: 'max limit is 30' }
      }
      await conn.query(addLike, [userId, ideaId])
      conn.query('COMMIT')
      return { message: 'success', totalLikes }
    } else {
      await conn.query(createLike, [[[userId, ideaId, 1]]])
      await conn.query('COMMIT')
      return { message: 'success' }
    }
  } catch (error) {
    await conn.query('ROLLBACK')
    console.log(error)
    return { error }
  } finally {
    await conn.release()
  }
}

async function getIdeaLikes(ideaId) {
  const ideaQry = `
  SELECT * FROM idea_likes 
  WHERE idea_id = ?
  `

  try {
    const [result] = await db.query(ideaQry, [ideaId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function deleteIdea(ideaId, userId) {
  const checkAuthor = `
  SELECT user_id FROM ideas WHERE id = ?
  `
  const dltIdeaQry = `
  DELETE FROM ideas WHERE id = ?
  `
  const dltLikeQry = `
  DELETE FROM idea_likes WHERE idea_id = ?
  `

  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const [checkResult] = await conn.query(checkAuthor, [ideaId, userId])
    if (checkResult[0].user_id !== Number(userId)) {
      return { forbidden: '你並不是作者，請勿亂刪別人文章!' }
    }

    await conn.query(dltLikeQry, [ideaId])
    await conn.query(dltIdeaQry, [ideaId])
    await conn.query('COMMIT')
    return { message: 'success' }
  } catch (error) {
    await conn.query('ROLLBACK')
    console.log(error)
    return { error }
  } finally {
    await conn.release()
  }
}

module.exports = {
  createIdeas,
  getIdeas,
  getIdea,
  getHotIdeas,
  addLikes,
  getIdeaLikes,
  deleteIdea
}
