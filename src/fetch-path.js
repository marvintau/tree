const outer = require('./outer');

function getSuggs(list, colName) {
  return list.map(({[colName]:col}) => col)
}

function getAlterPath(data, aliases, indexColumn, origPath) {

  const alterPaths = outer(origPath.map(seg =>  aliases[seg] || [seg]));

  for (let path of alterPaths){
    let {record, siblings} = get(data, {path, indexColumn})

    if (record !== undefined){

      let code = 'INFO_ALTER_PATH',
          suggs = getSuggs(siblings, indexColumn);

      return { record, suggs, code };
    }
  }

  return {};
}

function fetchPath(path, Sheets={}) {

  const {__PATH_ALIASES={}} = Sheets;

  if (typeof path !== 'string') {
    return {code: 'FAIL_INVALID_PATH'};
  }

  const [name, body] = path.split(':').map(elem => elem.trim());

  if (!(name || body)) {
    return {code: 'FAIL_INVALID_PATH'};
  } else if (Sheets[name] === undefined) {
    return {code: 'WARN_SHEET_NOT_FOUND'};
  }

  const {data, indexColumn} = Sheets[name];
  const path = body.split('/').map(elem => elem.trim());

  let {record, siblings} = get(data, {path, indexColumn});

  if (record !== undefined) {
    const suggs = getSuggs(siblings, indexColumn);
    const code = 'NORM';
    return { record, suggs, code};
  } else {
    const {record, suggs, code} = getAlterPath(data, __PATH_ALIASES, indexColumn, path);
    if (record !== undefined) {
      return {record, suggs, code};
    } else {
      return {record, suggs:[], code: 'WARN_RECORD_NOT_FOUND'}
    }
  }
}

module.exports = fetchPath;