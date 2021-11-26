const { textLenCheck } = require('../utils/utils')

test('test text length regardless of the language', () => {
  expect(textLenCheck('%%%我愛appworKs')).toBe(15)
})