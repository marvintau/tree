const {genName} = require('./util');

let a = 1,
    b = a + 1;

const getRec = () => {
  a += 2;
  b += 2;
  return {a, b, name: genName()};
}

const getRecs = (num) => {
  const res = [];
  for (let i = 0; i < num; i++) res.push(getRec());
  return res;
}

describe('function correctness', () => {

  const indexColumn = 'name';
  const array = [];

  test('adding', () => {
    const {add, get} = require('../dist');
    
    // add single
    add(array, getRec());
    expect(array[0].a).toBe(3);

    // add array of records
    add(array, getRecs(2));
    expect(array[1].a).toBe(5);
    expect(array.length).toBe(3);

    // add records
    add(array, getRecs(3), {path: [0]});
    add(array, getRecs(3), {path: [0, 0]});
    add(array, getRecs(3), {path: [0, 0, 0]});

    // add records to specific node with path
    const {record, list} = get(array, {path: [0, 0, 0], withList:true});
    expect(() => add(array, getRecs(3), {path: list.map(({name}) => name), indexColumn})).toThrow();
    // expect(record.__children.length).toBe(6);

    add(array, getRecs(10));
    
    expect(() => add(array, new Date())).toThrow();

  })

  test('getting', () => {
    const withList = true;
    const {get} = require('../dist');
    
    let {record:recordIndex, list:listIndex} = get(array, {path: [0, 0, 0]});
    expect(recordIndex.a).toBe(15);
    expect(listIndex).toBe(undefined);

    let {list:listIndex1} = get(array, {path: [0, 0, 0], withList});
    expect(listIndex1.includes(recordIndex)).toBe(true);

    const namePath = listIndex1.map(({name}) => name);
    let {record:recordPath} = get(array, {path: namePath, indexColumn})
    expect(recordPath.a).toBe(15);

    let {list:pathList} = get(array, {path: namePath, indexColumn, withList});
    expect(pathList.slice(-1)[0]).toBe(recordIndex);

    let {record: leaf} = get(array, {path: [0, 0, 0, 0], withList});
    expect(leaf.__children).toBe(undefined);
    
    // not found
    expect(get(array, {path: [0, 1, 2, 3]}).record).toBe(undefined);
    expect(get(array, {path: ['asd'], indexColumn:'name'}).record).toBe(undefined);

    // not provided
    expect(() => get(array, {})).toThrow();
  })

  test('removing', () => {
    const {get, del} = require('../dist');

    const beforeLast = array.slice(-2, -1)[0];
    del(array);
    expect(array.slice(-1)[0]).toBe(beforeLast);

    const lastThird = array.slice(-3)[0];
    del(array, {num:2});
    expect(array.slice(-1)[0]).toBe(lastThird);

    const anotherLastThrid = array.slice(-4)[0];
    del(array, {num:3, atIndex:array.length - 3})
    expect(array.slice(-1)[0]).toBe(anotherLastThrid);
  })

  test('flattening', () => {
    const {trav, flat} = require('../dist');

    const count = (array) => {
      let counter = 0 ;
      trav(array, () => counter ++);
      return counter;
    }

    expect(count(array) === flat(array).length).toBe(true);
  })

  test('group', () => {
    const {add, group} = require('../dist');

    const groupArr = [];
    add(groupArr, {a: 'a', b:'b'});
    add(groupArr, {a: 'a', b:'c'});
    add(groupArr, {a: 'bc', b:'c'});
    add(groupArr, {a: 'bc', b:'d'});

    expect(() => group(groupArr)).toThrow();
    expect(group(groupArr, 'a').a.length).toBe(2);
    expect(group(groupArr, ({a}) => a.length)['1'].length).toBe(2);
  })

})

