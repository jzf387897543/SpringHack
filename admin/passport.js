/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2021-09-13 01:25:29
 *  Filename: index.js
 *  Description: Created by SpringHack using vim automatically.
 */
const COLLECTION_NAME = 'token_collection';
const ITEM_NAME = 'token_item';

// const siteToken = await doLogin('uuuu', 'pppp');
// const accessInfo = await getAccessInfo(siteToken);
// await ensureStorageCreated(accessInfo.accessToken);
// await updateGithubToken(accessInfo.accessToken, (new Date()).toString());
// console.error(await queryGithubToken(accessInfo.accessToken));

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
      authorization: `Basic ${btoa(`${username}:${password}`)}`
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
  await fetch(MAKE_API(`/collections/${COLLECTION_NAME}/items/${ITEM_NAME}`, true), {
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

async function onLogin(event) {
  if (event instanceof KeyboardEvent && event.key !== 'Enter') {
    return;
  }
  event.preventDefault();
  const siteToken = await doLogin(user.value, pass.value);
  const accessInfo = await getAccessInfo(siteToken);
  await ensureStorageCreated(accessInfo.accessToken);
  const token = await queryGithubToken(accessInfo.accessToken);
  if (!/^\w[\w]+\w$/.test(token || '')) {
    alert(`failed: token=${token}`);
    return;
  }
  alert(`success: token=${token}`);
  let url = new URL(location.href);
  let trueHref = url.pathname.replace('/fetch/', '').replace('passport.html', 'index.html');
  location.href = `${trueHref}?token=${token}`;
}

async function onUpdate(event) {
  const token = prompt('Github Token Value');
  event.preventDefault();
  if (!token) {
    return;
  }
  const siteToken = await doLogin(user.value, pass.value);
  const accessInfo = await getAccessInfo(siteToken);
  await ensureStorageCreated(accessInfo.accessToken);
  await updateGithubToken(accessInfo.accessToken, token);
  alert('Github Token Updated');
}

pass.addEventListener('keydown', onLogin);
login.addEventListener('click', onLogin);
update.addEventListener('click', onUpdate);
