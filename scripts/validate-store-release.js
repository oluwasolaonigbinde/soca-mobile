const fs = require('fs');
const path = require('path');

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const allowExternalPlaceholders = args.has('--allow-external-placeholders');
const envArg = process.argv.find((arg) => arg.startsWith('--env='));
const envFile = envArg ? envArg.slice('--env='.length) : '.env.production';

const failures = [];
const warnings = [];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing.`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    failures.push(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function parseEnv(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {};
  }

  return fs
    .readFileSync(absolutePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;

      const separator = trimmed.indexOf('=');
      if (separator === -1) return env;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = value;
      return env;
    }, {});
}

function addExternalIssue(message) {
  if (allowExternalPlaceholders) {
    warnings.push(message);
    return;
  }

  failures.push(message);
}

function requireValue(source, key, value) {
  if (!value) {
    failures.push(`${source}: ${key} is required.`);
    return;
  }

  if (/your-|example\.com|<.+>|placeholder/i.test(value)) {
    addExternalIssue(`${source}: ${key} still looks like a placeholder (${value}).`);
  }
}

function requireHttpsUrl(source, key, value) {
  requireValue(source, key, value);
  if (value && !value.startsWith('https://')) {
    failures.push(`${source}: ${key} must be an https:// URL.`);
  }
}

const appJson = readJson('app.json');
const easJson = readJson('eas.json');
const env = {
  ...parseEnv(envFile),
  ...process.env,
};

if (!fs.existsSync(path.join(root, envFile))) {
  addExternalIssue(`${envFile} is missing. Create it or pass --env=<file> for the release environment being validated.`);
}

if (appJson?.expo) {
  const { expo } = appJson;
  requireValue('app.json', 'expo.name', expo.name);
  requireValue('app.json', 'expo.slug', expo.slug);
  requireValue('app.json', 'expo.ios.bundleIdentifier', expo.ios?.bundleIdentifier);
  requireValue('app.json', 'expo.android.package', expo.android?.package);

  if (!expo.ios?.buildNumber) failures.push('app.json: expo.ios.buildNumber is required.');
  if (!Number.isInteger(expo.android?.versionCode)) {
    failures.push('app.json: expo.android.versionCode must be an integer.');
  }

  if (expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption !== false) {
    warnings.push('app.json: confirm iOS encryption export compliance; ITSAppUsesNonExemptEncryption is not false.');
  }

  const accessedApiTypes = expo.ios?.privacyManifests?.NSPrivacyAccessedAPITypes ?? [];
  const userDefaultsReason = accessedApiTypes.find(
    (entry) =>
      entry.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults' &&
      Array.isArray(entry.NSPrivacyAccessedAPITypeReasons) &&
      entry.NSPrivacyAccessedAPITypeReasons.includes('CA92.1'),
  );
  if (!userDefaultsReason) {
    failures.push('app.json: expo.ios.privacyManifests must declare UserDefaults reason CA92.1.');
  }

  const blockedPermissions = new Set(expo.android?.blockedPermissions ?? []);
  [
    'android.permission.RECORD_AUDIO',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.MODIFY_AUDIO_SETTINGS',
  ].forEach((permission) => {
    if (!blockedPermissions.has(permission)) {
      failures.push(`app.json: android.blockedPermissions must include ${permission}.`);
    }
  });
}

if (easJson) {
  if (easJson.cli?.appVersionSource !== 'local') {
    warnings.push('eas.json: cli.appVersionSource should remain "local" unless release versioning is intentionally moved to remote.');
  }

  const production = easJson.build?.production;
  if (!production) {
    failures.push('eas.json: build.production is required.');
  } else {
    if (production.env?.EXPO_PUBLIC_DEMO_MODE !== 'false') {
      failures.push('eas.json: production.env.EXPO_PUBLIC_DEMO_MODE must be "false".');
    }
    if (production.autoIncrement !== true) {
      warnings.push('eas.json: production.autoIncrement is not true; confirm manual versioning before release.');
    }
  }

  if (!easJson.submit?.production) {
    failures.push('eas.json: submit.production is required.');
  }
}

requireHttpsUrl(envFile, 'EXPO_PUBLIC_SUPABASE_URL', env.EXPO_PUBLIC_SUPABASE_URL);
requireValue(envFile, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
requireHttpsUrl(envFile, 'EXPO_PUBLIC_PRIVACY_POLICY_URL', env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
requireHttpsUrl(envFile, 'EXPO_PUBLIC_TERMS_URL', env.EXPO_PUBLIC_TERMS_URL);
requireHttpsUrl(envFile, 'EXPO_PUBLIC_ACCOUNT_DELETION_URL', env.EXPO_PUBLIC_ACCOUNT_DELETION_URL);

if (env.EXPO_PUBLIC_DEMO_MODE && env.EXPO_PUBLIC_DEMO_MODE !== 'false') {
  failures.push(`${envFile}: EXPO_PUBLIC_DEMO_MODE must be false or absent for store builds.`);
}

if (env.EXPO_PUBLIC_DEV_SIGNIN_EMAIL || env.EXPO_PUBLIC_DEV_SIGNIN_PASSWORD) {
  failures.push(`${envFile}: dev quick-login credentials must not be set for store builds.`);
}

if (!fs.existsSync(path.join(root, 'supabase/functions/delete-account/index.ts'))) {
  failures.push('supabase/functions/delete-account/index.ts is required for in-app account deletion.');
}

warnings.forEach((warning) => console.warn(`WARN ${warning}`));

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}

console.log(`PASS Store release validation passed for ${envFile}.`);
