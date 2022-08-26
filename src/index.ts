import { getInput, setFailed, InputOptions, info, startGroup, endGroup } from '@actions/core';
import fetch from 'node-fetch';

interface Button {
  name: string;
  uri: string;
}

try {
  const inputOptions: InputOptions = { trimWhitespace: true };
  const webhook = getInput('webhook', { ...inputOptions, required: true });
  const title = getInput('title', inputOptions);
  const message = getInput('message', inputOptions);
  const color = getInput('color', inputOptions);
  const buttons: Button[] = getInput('buttons', inputOptions)
    .split('\n')
    .reduce((btns, line) => {
      line = line.trim();
      let i: number;
      if (!!line.length && !!(i = line.search(/https?:\/\/.+/))) {
        const name = line.substring(0, i).trim();
        const uri = line.substring(i).trim();
        if (!!name.length && !!uri.length) {
          btns.push({ name, uri });
        }
      }
      return btns;
    }, [] as Button[]);

  const payload = {
    '@context': 'https://schema.org/extensions',
    '@type': 'MessageCard',
    themeColor: color,
    title: title,
    text: message,
    potentialAction: buttons.map(({ name, uri }) => ({ '@type': 'OpenUri', name, targets: [{ os: 'default', uri }] }))
  };

  startGroup('Payload to send');
  info(JSON.stringify(payload, null, 2));
  endGroup();

  fetch(webhook, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => {
      if (response.ok) {
        info('Successfully sent!');
      } else {
        setFailed(`Sending failed: STATUS ${response.status} ${response.statusText}`);
      }
    })
    .catch((error: any) => setFailed(error.message));
} catch (error: any) {
  setFailed(error.message);
}
