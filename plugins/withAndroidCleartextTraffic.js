// Expo config plugin: ensures cleartext HTTP is allowed in release builds.
// React Native 0.73+ template includes a network_security_config.xml that
// can override android:usesCleartextTraffic from the manifest. This plugin
// writes an explicit XML that permits cleartext on all domains.
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
`;

module.exports = function withAndroidCleartextTraffic(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );
      fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(path.join(resDir, 'network_security_config.xml'), XML);
      return config;
    },
  ]);
};
