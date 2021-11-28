const users = [
  {
    id: 1,
    provider: 'native',
    role: 'visitor',
    email: 'test1@gmail.com',
    password: 'test1password',
    name: 'test1',
    picture: 'default-picture',
    access_token: 'test1accesstoken',
    access_expired: '1d'
  },
  {
    id: 2,
    provider: 'native',
    role: 'visitor',
    email: 'test2@gmail.com',
    password: 'test2passwod',
    name: 'test2',
    picture: 'default-picture',
    access_token: 'test2accesstoken',
    access_expired: '1d'
  }
]

const ideaLikes = [
  {
    id: 1,
    user_id: 1,
    idea_id: 1,
    likes_num: 2
  },
  {
    id: 2,
    user_id: 2,
    idea_id: 1,
    likes_num: 5
  }
]

const warRoom = {
  id: 1,
  stock_id: 1,
  user_id: 1,
  date_time: new Date('2020-01-01'),
  war_room_title: 'test-war-room-title',
  state: 1,
  open_mic: 0,
  open_draw: 0
}

module.exports = { users, ideaLikes, warRoom }
