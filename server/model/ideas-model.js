// Require mysql connection
const db = require('./config/mysqlConnection')
const moment = require('moment')
const { search } = require('../routes/modules/render')

async function createIdeas(ideasData) {
  try {
    const [stockIdResult] = await db.query(
      'SELECT * FROM stock WHERE stock_code = ?',
      [ideasData.stock_code]
    )

    ideasData.stock_id = stockIdResult[0].stock_id
    ideasData.date = moment().format('YYYY-MM-DD')
    delete ideasData['stock_code']

    const [result] = await db.query('INSERT INTO ideas SET ?', [ideasData])
    const insertId = result.insertId
    return insertId
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getIdeas(userId) {
  const qryString = `
  SELECT ideas.*, user.name as user_name, stock.stock_code as stock_code, stock.company_name as company_name, sum(idea_likes.likes_num) as total_likes
  FROM ideas
  INNER JOIN user ON user.id = ideas.user_id
  INNER JOIN stock ON stock.stock_id = ideas.stock_id
  LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
  WHERE user.id = ?
  GROUP BY ideas.id
  `

  try {
    const [result] = await db.query(qryString, [userId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getIdea(ideaId) {
  const qryString = `
    SELECT ideas.*, user.name as user_name, user.picture as user_picture ,stock.stock_code as stock_code, stock.company_name as company_name
    FROM ideas
    INNER JOIN user ON user.id = ideas.user_id
    INNER JOIN stock ON stock.stock_id = ideas.stock_id
    WHERE ideas.id = ?
  `
  try {
    const [result] = await db.query(qryString, [ideaId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getHotIdeas(filter, page, condition = {}) {
  let qryString

  try {
    switch (filter) {
      case 'time': {
        qryString = `
        SELECT ideas.*, user.name as user_name, stock.stock_code as stock_code, stock.company_name as company_name, sum(idea_likes.likes_num) as total_likes
        FROM ideas
        INNER JOIN user ON user.id = ideas.user_id
        INNER JOIN stock ON stock.stock_id = ideas.stock_id
        LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY ideas.date DESC
        LIMIT 10
        `
        break
      }
      case 'followers': {
        qryString = `
        SELECT ideas.*, user.name as user_name, stock.stock_code as stock_code, stock.company_name as company_name, sum(idea_likes.likes_num) as total_likes
        FROM ideas
        INNER JOIN user ON user.id = ideas.user_id
        INNER JOIN stock ON stock.stock_id = ideas.stock_id
        LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY user.followers DESC
        LIMIT 10
        `
        break
      }
      case 'likes': {
        qryString = `
        SELECT ideas.*, user.name as user_name, stock.stock_code as stock_code, stock.company_name as company_name, sum(idea_likes.likes_num) as total_likes
        FROM ideas
        INNER JOIN user ON user.id = ideas.user_id
        INNER JOIN stock ON stock.stock_id = ideas.stock_id 
        LEFT JOIN idea_likes ON idea_likes.idea_id = ideas.id
        GROUP BY ideas.id
        ORDER BY total_likes DESC
        LIMIT 10
        `
        break
      }
      case 'byFollowing': {
        qryString = `
        SELECT ideas.*, user.name as user_name, stock.stock_code as stock_code, stock.company_name as company_name
        FROM ideas
        INNER JOIN stock ON stock.stock_id = ideas.stock_id
        inner join (select follow_status.following_id as following_id from follow_status where follow_status.user_id = ?) as follow_status on follow_status.following_id = ideas.user_id
        INNER JOIN user ON user.id = ideas.user_id
        ORDER BY ideas.date DESC
        `
        break
      }
    }

    const userId = condition.userId || null
    const limit = condition.limit || null

    const [result] = await db.query(qryString, [userId])

    return result
  } catch (error) {
    console.error(error)
    return { error }
  }
}

async function addLikes(userId, ideaId, isLiked) {
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
      const [result] = await conn.query(addLike, [userId, ideaId])
      conn.query('COMMIT')
      return result.insertId
    } else {
      const [result] = await conn.query(createLike, [[[userId, ideaId, 1]]])
      await conn.query('COMMIT')
      return result.insertId
    }
    
  } catch (error) {
    await conn.query('ROLLBACK')
    console.error(error)
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
    console.error(error)
    return { error }
  }
}

module.exports = {
  createIdeas,
  getIdeas,
  getIdea,
  getHotIdeas,
  addLikes,
  getIdeaLikes
}
