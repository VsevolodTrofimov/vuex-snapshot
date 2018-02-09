# vuex-snapshot • [![codecov][codecov-img]][codecov-link] [![Build Status][travis-img]][travis-link]

Module to snapshot test vuex actions with jest

## Table of contents
* [Why use snapshot tests for actions](#why-use-snapshot-tests-for-actions)
* [Getting started](#getting-started)
  + [Prerequisites](#prerequisites)
  + [Installation](#installation)
  + [Basic example](#basic-example)
* [Usage](#usage)
  + [snapAction overloads](#snapaction-overloads)
  + [Testing async actions](#testing-async-actions)
  + [Testing async actions [2]](#testing-async-actions--2-)
  + [Using mocks](#using-mocks)
  + [Using mockPromises](#using-mockpromises)
  + [Utilities](#utilities)
  + [Config](#config)
* [Tips](#tips)
  + [Mocking timers for vuex-snapshot resolutions](#mocking-timers-for-vuex-snapshot-resolutions)
  + [Deep testing (execute called actions)](#deep-testing--execute-called-actions-)

## Why use snapshot tests for actions
I hope you are familiar with what [jest][jest-main], [vuex][vuex-main] 
and [snapshot testing][jest-snapshot-testing] are.

Vuex actions are straightforward to read, and writing tests that are 
more complex and 10 times longer than the code they cover feels really wrong.

And they fulfill 3 roles:
 1. Representation of app logic (conditions & calls of commits\dispatches)
 2. API for components
 3. Asynchronous layer for store (as mutations must be sync)

So we mainly test them to make sure that when we change \ add execution path other's don't get broken

Our component API didn't change

With added complexity of controlling async behaviors and rest of the store

vuex-snapshot tries to make this easy and declarative

## Getting started
### Prerequisites
 - :heavy_check_mark: Node 6 stable or later
 - :heavy_check_mark: have `jest` and, `babel-jest` installed 
   (es6-modules imports would be used in examples, but `vuex-snapshot` is also output as CommonJS)

### Installation
#### via npm
```bash
npm install --save-dev vuex-snapshot
```

#### via yarn
```bash
yarn add -D vuex-snapshot
```


### Basic example
Say, you are testing some card game

```js
// @/store/actions.js
export const restartGame = ({commit}) => {
  commit('shuffleDeck')
  commit('setScore', 0)
}


// actions.spec.js
import {snapAction} from 'vuex-snapshot'
import {restartGame} from '@/store/actions'

test('restartGame matches snapshot', () => {
  expect(snapAction(restartGame)).toMatchSnapshot()
})

/* 
 after running jest
 __snapshots__/actions.spec.js
 should look like
 */

// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`play restartGame matches snapshot 1`] = `
Array [
  Object {
    "message": "COMMIT: shuffleDeck",
  },
  Object {
    "message": "COMMIT: setScore",
    "payload": 0,
  },
]
`;
```
> NOTE: by default vuex-snapshot would not use commit & dispatch from your store, but you can pass them via mocks


## Usage
### snapAction overloads
```js
import {snapAction, Snapshot} from 'vuex-snapshot'

snapAction(action)
snapAction(action, mocks)
snapAction(action, resolutions)
snapAction(action, mocks, resolutions)
snapAction(action, mocks, resolutions, snapshotToWriteTo)
// where snapshotToWriteTo is instance of Snapshot class 
```

If action returned a promise `snapAction` would do the same.

That promise will resolve with an `Array` of `Object`s that represents action's execution. 

It could be compared to snapshot, or tested manually.

If vuex-snapshot experienced internal error snapAction test it would reject with an `Object`
Of following structure
```js
{
  err, // Actual error that has been thrown
  run // action's execution up to the error point
}
```


If action returned anything that is not a promise (including `undefined`) `snapAction` would
synchronously return an array mentioned above.


### Testing async actions
```js
// @/store/actions.js
export const openDashboard = ({commit, dispatch}) => new Promise((resolve, reject) => {
  commit('setRoute', 'loading')
  dispatch('load', 'dashboard')
    .then(() => {
      commit('setRoute', 'dashboard')
      resolve()
    })
    .catch('reject')
})

// actions.spec.js
import {snapAction, MockPromise} from 'vuex-snapshot'
import {openDashboard} from '@/store/actions'

test('openDashboard matches success snapshot', done => {
  const dispatch = name => new MockPromise(name)
  const resolutions = ['load']

  snapAction(openDashboard, {dispatch}, resolutions)
    .then(run => {
      expect(run).toMatchSnapshot()
      done()
    })
})
```


### Testing async actions [2]
```js
// @/store/actions.js
export const login = ({commit, dispatch, getters}, creditals) => {
  return new Promise((resolve, reject) => {
    if(!getters.user.loggedIn) {
      fetch('/api/login/', {
        method: 'POST',
        body: JSON.stringify(creditals)
      })
        .then(res => res.json())
        .then(data => {
          commit('setUser', data)
          dispatch('setRoute', 'profile')
          resolve()
        })
        .catch(reject)
    } else {
      resolve()
    }
  })
}


// actions.spec.js
import {snapAction, useMockFetch, MockPromise} from 'vuex-snapshot'
import {login} from '@/store/actions'

test('login matches success snapshot', done => {
  useMockFetch()
  
  const payload = { authCode: 1050 }
  const getters = {
    user: {
      loggedIn: false
    }
  }

  const resolutions = [{
    name: '/api/login/',
    payload: { json: () => new MockPromise('json') }
  }, {
    name: 'json',
    payload: { name: 'someUser', id: 21 }
  }]

  snapAction(login, {getters, payload}, resolutions)
    .then(run => {
      expect(run).toMatchSnapshot()
      done()
    })
})

test('login matches network fail snapshot', done => {
  useMockFetch()
  
  const payload = { authCode: 1050 }
  const getters = {
    user: {
      loggedIn: false
    }
  }

  const resolutions = [{
    name: '/api/login/',
    type: 'reject',
    payload: new TypeError('Failed to fetch')
  }]

  snapAction(login, {getters, payload}, resolutions)
    .then(run => {
      /* vuex-snapshot would write that action rejected in the snapshot
         so you can test rejections as well */
      expect(run).toMatchSnapshot()
      done()
    })
})
```
> NOTE: promises with same names would be matched to resolutions in order they were created


### Using mocks
You can pass state, getters, payload of any type

As well as custom `commit` and `dispatch` functions

> NOTE: Make sure your getters are what they return, not how they calculate it

#### Example
```js
const action = jest.fn()

const mocks = {
  payload: 0,
  state: {
    stateValue: 'smth'
  },
  getters: {
    answer: 42
  },
  commit: console.log
  dispatch: jest.fn()
}

snapAction(action, mocks)

// would call the action like
action({
  state: mocks.state,
  getters: mocks.getters,
  commit: (name, payload) => mocks.commit(name, payload, proxies),
  dispatch: (name, payload) => mocks.dispatch(name, payload, proxies),
}, mocks.payload)
```
Proxies is an object with commit and dispatch that were actually passed to action (not those from mocks)

> Note: state, getters ... are being reassigned, not copied. 
> Like they would pass `.toEqual` test, but no a `.toBe` one

### Using mockPromises
```js
import {MockPromise} from 'vuex-snapshot'

const name = 'some string'
const cb = (resolve, reject) => {}
new MockPromise(cb, name)
new MockPromise(cb) // name will be 'Promise'
new MockPromise(name) //cb will be  () => {}

// some manual control
const toResolve = new MockPromise('some name')
const toReject = new MockPromise('some other name')
const payload = {type: 'any'}

toResolve.resovle(payload)
toReject.resovle(payload)

console.log(toReject.name) // some other name
```
This class extends Promise, so Promise.all and other promise methods work perfectly for it

> NOTE: `new MockPromise.then(cb)` actually creates new `MockPromise` (that is default Promise behavior).
> So there is a risk of resolutions['Promise'] matching this one instead of the Promise you've meant
> This is just as true for any other method

### Utilities
```js

// all vuex-snapshot Utilities
import {
  reset,
  
  resetTimetable,
  resetConfig,

  useMockPromise,
  useRealPromise,

  useMockFetch,
  useRealFetch,
} from 'vuex-snapshot'
```

#### reset
Reset calls all other resets and useReal

#### resetTimetable
Makes sure no already created promises could be matched to resolutions

#### resetConfig
Resets `vuexSnapshot.config` to default values

#### useMockPromise
Replaces `window.Promise` (same as `global.Promise`) with vuexSnapshot.MockPromise that could be named and resolved manually

#### useRealPromise
Sets `window.Promise` to its original value

#### useMockFetch
Replaces `window.fetch` (same as `global.fetch`) with vuexSnapshot.MockPromise that could be named and resolved manually

#### useRealFetch
Sets `window.fetch` to its original value


### Config
These fit very specific types of tests, so using 
`beforeEach(vuexSnapshot.reset)` is highly encouraged

#### `vuexSnapshot.config.autoResolve`
##### Default
false

##### Description
Instead of acting according to passed resolutions vuex-snapshot will
automatically trigger resolve on each mock promise in 
order they were created


#### `vuexSnapshot.config.snapEnv`
##### Default
false
##### Description
Starts snapshot with 2 entries
``` js
{
  message: 'DATA MOCKS'
  payload: {
    state //value of state
    getters // value of getters
  }
}

{
  message: 'ACTION MOCKS'
  payload // passed action payload if there was one
}

// values of state, gettes and payload are not being copied
```


#### `vuexSnapshot.config.allowManualActionResolution`
##### Default
false
##### Description
Allows vuexSnapshot to resolve promise returned by action 


## Tips
### Mocking timers for vuex-snapshot resolutions
```js
import {snapAction, MockPromise} from 'vuex-snapshot'

test('action snapshot usnig timers', done => {
  const realSetTimeout = setTimeout
  window.setTimeout = (cb, time) => {
    const mock = new MockPromise('Timeout')
    mock.then(cb)
    return realSetTimeout(mock.resolve, time)
  }

  // actual "test"
  const action = () => new Promise(resolve => {
    setTimeout(resolve, 100500)
  })

  snapAction(action, ['Timeout'])
    .then(run => {
      expect(run).toMatchSnapshot()
      done()
    })
    .catch(err => {
      console.error(err)
      console.log(timetable.entries)
      done()
    })

  window.setTimeout = realSetTimeout
})
```

> NOTE: This is not fully accurate simulation because resolving it manually or via resolutions
> would cause a bit higher priority in [event-loop], and resolution on timeout would be 1 tick late
> Because Promise.then() is not synchronous

### Deep testing (execute called actions)
```js
// @/store/actions.js
export const action1 = ({commit, dispatch}) => {
  commit('mutation1')
  dispatch('action2')
}

export const action2 = ({commit, dispatch}) => {
  commit('mutation2')
}


// actions.spec.js
import {snapAction} from 'vuex-snapshot'
import * as actions from '@/store/actions'

test('Many actions', () => {
  const state = {}
  const getters = {}

  const dispatch = (namy, payload, {commit, dispatch}) => {
    return actions[name]({state, getters, commit, dispatch}, payload)
  }

  expect(snapAction(actions.action1, {state, getters, dispatch})).toMatchSnapshot()
})
```

This should work for async actions too


<!-- Links -->
[vuex-main]: https://vuex.vuejs.org/
[jest-main]: https://facebook.github.io/jest/
[jest-snapshot-testing]: https://facebook.github.io/jest/docs/en/snapshot-testing.html
[event-loop]: https://youtu.be/8aGhZQkoFbQ
<!-- Badges -->
[codecov-img]: https://codecov.io/gh/VsevolodTrofimov/vuex-snapshot/branch/master/graph/badge.svg
[codecov-link]: https://codecov.io/gh/VsevolodTrofimov/vuex-snapshot

[travis-img]: https://travis-ci.org/VsevolodTrofimov/vuex-snapshot.svg?branch=master
[travis-link]: https://travis-ci.org/VsevolodTrofimov/vuex-snapshot
