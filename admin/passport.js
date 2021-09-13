/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2021-09-13 18:29:00
 *  Filename: passport.js
 *  Description: Created by SpringHack using vim automatically.
 */
const COLLECTION_NAME = 'token_collection';
const ITEM_NAME = 'token_item';

// const siteToken = await doLogin('uuuu', 'pppp');
// const accessInfo = await getAccessInfo(siteToken);
// await ensureStorageCreated(accessInfo.accessToken);
// await updateGithubToken(accessInfo.accessToken, (new Date()).toString());
// console.error(await queryGithubToken(accessInfo.accessToken));

let frame = null;
const isChild = (new URL(location.href)).host === 'thingproxy.freeboard.io';

function MAKE_API(api, proxy = false) {
  if (proxy) {
    return `https://thingproxy.freeboard.io/fetch/https://api.kvstore.io${api}`;
  }
  return `https://api.kvstore.io${api}`;
}

async function doLogin(username, password) {
  return fetch(MAKE_API('/users/login'), {
    headers: {
      accept: 'application/json, text/plain, */*',
      authorization: `Basic ${window['btoa'](`${username}:${password}`)}`
    },
    method: 'POST'
  }).then(res => res.text());
}

async function getAccessInfo(siteToken) {
  const userInfo = await fetch(MAKE_API('/users/me'), {
    headers: {
      accept: 'application/json, text/plain, */*',
      authorization: `Bearer ${siteToken}`,
    },
    method: 'GET'
  }).then(res => res.json());
  const { email, storage_uuid: uuid, api_key: accessToken } = userInfo;
  return {
    uuid,
    email,
    accessToken
  };
}

async function ensureStorageCreated(accessToken) {
  const collectionsInfo  = await fetch(MAKE_API('/collections', true), {
    headers: {
      'content-type': 'application/json',
      kvstoreio_api_key: accessToken
    },
    method: 'GET'
  }).then(res => res.json());
  if (!(collectionsInfo.total_collections > 0
    && collectionsInfo.collections[COLLECTION_NAME])) {
    await fetch(MAKE_API('/collections', true), {
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/plain, */*',
        kvstoreio_api_key: accessToken
      },
      method: 'POST',
      body: JSON.stringify({
        collection: COLLECTION_NAME
      })
    });
  }
  const itemInfo = await fetch(MAKE_API(`/collections/${COLLECTION_NAME}/items/${ITEM_NAME}`, true), {
    headers: {
      'content-type': 'application/json',
      kvstoreio_api_key: accessToken
    },
    method: 'GET'
  }).then(res => res.json());
  if (!itemInfo.value) {
    await fetch(MAKE_API(`/collections/${COLLECTION_NAME}/items/${ITEM_NAME}`, true), {
      headers: {
        accept: 'application/json, text/plain, */*',
        kvstoreio_api_key: accessToken
      },
      method: 'PUT',
      body: 'uninitialize'
    }).then(res => res.json());
  }
}

async function queryGithubToken(accessToken) {
  const itemInfo = await fetch(MAKE_API(`/collections/${COLLECTION_NAME}/items/${ITEM_NAME}`, true), {
    headers: {
      'content-type': 'application/json',
      kvstoreio_api_key: accessToken
    },
    method: 'GET'
  }).then(res => res.json());
  return itemInfo.value;
}

async function updateGithubToken(accessToken, githubToken) {
  return fetch(MAKE_API(`/collections/${COLLECTION_NAME}/items/${ITEM_NAME}`, true), {
    headers: {
      accept: 'application/json, text/plain, */*',
      kvstoreio_api_key: accessToken
    },
    method: 'PUT',
    body: githubToken
  }).then(res => res.json());
}

const user = document.getElementById('username');
const pass = document.getElementById('password');
const login = document.getElementById('login');
const update = document.getElementById('update');
const loading = document.getElementById('loading');

async function onLogin(event) {
  if (event instanceof KeyboardEvent && event.key !== 'Enter') {
    return;
  }
  if (event.type === 'keydown' && !Reflect.has(event, 'key')) {
    return;
  }
  event.preventDefault();
  if (!isChild) {
    frame.contentWindow.postMessage({
      type: 'login',
      user: user.value,
      pass: pass.value
    }, '*');
    return;
  }
  const siteToken = await doLogin(user.value, pass.value);
  const accessInfo = await getAccessInfo(siteToken);
  await ensureStorageCreated(accessInfo.accessToken);
  const token = await queryGithubToken(accessInfo.accessToken);
  if (!/^\w[\w]+\w$/.test(token || '')) {
    alert(`failed: token=${token}`);
    return;
  }
  alert(`success: token=${token}`);
  window.parent.postMessage({
    token,
    type: 'passport'
  }, '*');
  // let url = new URL(location.href);
  // let trueHref = url.pathname.replace('/fetch/', '').replace('passport.html', 'index.html');
  // location.href = `${trueHref}?token=${token}`;
}

async function onUpdate(event) {
  event.preventDefault();
  if (!isChild) {
    frame.contentWindow.postMessage({
      type: 'update',
      user: user.value,
      pass: pass.value
    }, '*');
    return;
  }
  const token = prompt('Github Token Value');
  if (!token) {
    return;
  }
  const siteToken = await doLogin(user.value, pass.value);
  const accessInfo = await getAccessInfo(siteToken);
  await ensureStorageCreated(accessInfo.accessToken);
  const result = await updateGithubToken(accessInfo.accessToken, token);
  alert(`update result ${result.status}`);
}

pass.addEventListener('keydown', onLogin);
login.addEventListener('click', onLogin);
update.addEventListener('click', onUpdate);

if (isChild) {
  window.addEventListener('message', (event) => {
    if (event.data && ['login', 'update'].includes(event.data.type)) {
      user.value = event.data.user;
      pass.value = event.data.pass;
    }
    (
      window[(event.data.type || '').replace(/\w/, ch => `on${ch.toUpperCase()}`)]
      ||
      (() => {})
    )(new Event('fake'));
  });
  window.parent.postMessage('passport-load', '*');
} else {
  frame = document.createElement('iframe');
  frame.style.display = 'none';
  frame.src = `https://thingproxy.freeboard.io/fetch/${location.href}`;
  frame.className = 'passport-frame';
  frame.referrerPolicy = 'no-referrer';
  document.body.appendChild(frame);
  window.addEventListener('message', (event) => {
    if (event.data) {
      if (event.data === 'passport-load') {
        loading.style.display = 'none';
      }
      if (event.data.type === 'passport' ) {
        window.parent.postMessage(event.data, '*');
      }
    }
  });
}
