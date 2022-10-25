// Functions
function getQueryObject() {
  const queryParamsString = window.location.search.substr(1)
  const queryParams = queryParamsString
    .split('&')
    .reduce((accumulator, singleOueryParam) => {
      const [key, value] = singleOueryParam.split('=')
      accumulator[key] = value
      return accumulator
    }, {})
  return queryParams
}
