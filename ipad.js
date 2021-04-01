/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2021-04-01 21:08:26
 *  Filename: ipad.js
 *  Description: Created by SpringHack using vim automatically.
 */
function correctKeyboardEvent({ mods, when }, event) {
  const props = [
    'key', 'code', 'location', 'ctrlKey', 'shiftKey', 'altKey',
    'metaKey', 'repeat', 'isComposing', 'charCode', 'keyCode', 'keyIdentifier'
  ];
  if (when(event)) {
    const init = {};
    for (const p of props) {
      init[p] = event[p];
    }
    for (const { prop, value } of mods) {
      init[prop] = value;
    }
    const newEvent = new KeyboardEvent(event.type, init);
    event.preventDefault();
    event.stopImmediatePropagation();
    document.dispatchEvent(newEvent);
  }
}

const modCtrlC = correctKeyboardEvent.bind(
  null,
  {
    mods: [
      { prop: 'which', value: 67 },
      { prop: 'keyCode', value: 67 }
    ],
    when: e => (e.key === 'c' && e.keyCode === 13)
  }
);

document.addEventListener('keyup', modCtrlC);
document.addEventListener('keydown', modCtrlC);
