# vuex-snapshot • [![codecov][codecov-img]][codecov-link] [![Build Status][travis-img]][travis-link]

Module to snapshot test vuex actions with jest

## Table of contents
- Why snapshot test actions
- Getting started
- Usage
  - Async actions
  - Passing mocks
  - Using mockPromises
  - Utilities
  - Config
- :hammer: Tips

## Why snapshot test actions
I hope you are familiar with what [jest][jest-main], [vuex][vuex-main] 
and [snapshot testsing][jest-snapshot-testing] are.

Vuex actions straightforward to read, and writing tests that are 
more complex and 4 times as long as they are feels really wrong.

And they fullfill 3 roles:
 1. Representation of app logic (conditions & calls of commits\dispatches)
 2. API for components
 3. Asyncronus layer for store (as mutations must be sync)

So we mainly tests them to make sure that when we change \ add execution path other's dont get broken

Our component API didn't chage

With added complexity of controlling async behaviours and rest of the store

vuex-snapshot tries to make this as easy and declarative

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
import actions from '@/store/actions'

test('restartGame matches snapshot', () => {
  expect(snapAction(actions.restartGame)).toMatchSnapshot()
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
_NOTE: by default vuex-snapshot would not use commit & dispatch from your store, but you can pass them via mocks_ 


## Usage
### snapAcion overloads
```js
import {snapAction, Snapshot} from 'vuex-snapshot'

snapAction(action)
snapAction(action, mocks)
snapAction(action, resolutions)
snapAction(action, mocks, resolutions)
snapAction(action, mocks, resolutions, snapshotToWriteTo)
// where snapshotToWriteTo is instance of Snapshot class 
```
### Testing aync actions
### Testing aync actions [2]
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
import actions from '@/store/actions'

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

  snapAction(actions.login, {getters, payload}, resolutions)
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

  snapAction(actions.login, {getters, payload}, resolutions)
    .then(run => {
      expect(run).toMatchSnapshot()
      done()
    })
})
```
_NOTE: promises with same names would be matched to resolutions in order they were created_

### Using mocks
:hammer: Readme work in progress

You can pass state, getters, payload of any type

As well as custom `commit` and `dispatch` functions

### Using mockPromises
:hammer: Readme work in progress
```js
import {MockPromise} from 'vuex-snapshot'

const name = 'some string'
const cb = (resolve, reject) => {}
new MockPromise(cb, name)
new MockPromise(cb) // name will be 'Promise'
new MockPromise(name) //cb will be  () => {}
```

### Utilities
:hammer: Readme work in progress
```js
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
Sets `window.Promise` to it's original value

#### useMockFetch
Replaces `window.fetch` (same as `global.fetch`) with vuexSnapshot.MockPromise that could be named and resolved manually

#### useRealFetch
Sets `window.fetch` to it's original value

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
:hammer: Readme work in progress
### Mocking timers for vuex-snapshot resolutions

### Deep testing (execute called actions)

### Resolving manually

<!-- Links -->
[vuex-main]: https://vuex.vuejs.org/
[jest-main]: https://facebook.github.io/jest/
[jest-snapshot-testing]: https://facebook.github.io/jest/docs/en/snapshot-testing.html

<!-- Badges -->
[codecov-img]: https://codecov.io/gh/VsevolodTrofimov/vuex-snapshot/branch/master/graph/badge.svg
[codecov-link]: https://codecov.io/gh/VsevolodTrofimov/vuex-snapshot

[travis-img]: https://travis-ci.org/VsevolodTrofimov/vuex-snapshot.svg?branch=master
[travis-link]: https://travis-ci.org/VsevolodTrofimov/vuex-snapshot