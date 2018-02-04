import useGlobally from '../src/useGlobally'
import serialize from '../src/serialize'
import {MockPromise} from '../src/mockPromise'


test('Serialize matches snapshot', () => {
  expect(serialize({
    a: () => {}, 
    b: 'some text', 
    c: ['nested array'],
    d: {
      e: 'nested object'
    }
  })).toMatchSnapshot()

  expect(serialize(() => {})).toMatchSnapshot()
  expect(serialize('str')).toMatchSnapshot()
  expect(serialize(100)).toMatchSnapshot()
  expect(serialize(['txt', 10])).toMatchSnapshot()
  expect(serialize(new MockPromise('smth'))).toMatchSnapshot()
})


test('UseGlobally replaces global', () => {
  global.testVar = 10
  useGlobally('testVar', 11)

  expect(testVar).toBe(11)

  delete global.testVar
})