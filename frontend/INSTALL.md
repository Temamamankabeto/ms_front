# Install Guide

This project is configured to use the public npm registry through `.npmrc`:

```bash
registry=https://registry.npmjs.org/
```

Run:

```bash
npm install
npm run dev
```

If your global npm config still points to an old proxy/registry, reset it once:

```bash
npm config set registry https://registry.npmjs.org/
npm config delete proxy
npm config delete https-proxy
npm cache clean --force
npm install
```
