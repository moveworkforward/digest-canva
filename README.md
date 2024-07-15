# Ally Digest for Canva

## Description
Ally Digest for Canva is a tool designed to integrate with Canva, sending a daily, weekly, or biweekly digest of your Canva events to your email.

## Environment Variables

1. Copy `<repo>/.env.template` file to `<repo>/.env.personal`.

2. Enter the values for the variables inside `<repo>/.env.personal` and save it.

CANVA_CLIENT_ID and CANVA_CLIENT_SECRET are the credentials you get from Canva when you create an integration.
CANVA_APP_ID you get from Canva when you create an application.

## Shared Folders & NPM Packages
1. Make the shared libraries available to backend application by running the following commands:

    ```sh
    cd apps/be
    
    cd digest-canva
    ln -s ../_shared shared
    npm i

## Deploy a backend application

Run the following command to deploy a back-end application:

    ```sh
    npm run deploy --stage=personal --application=be/digest-canva
    ```

## Deploy a Specific lambda

This greatly speeds up the deployment, because no Cloudformation is executed.

```sh
npm run deploy --stage=<stage> --application=<application-type>/<application-name> --func=<function-name>
```

for example:

```sh
npm run deploy --stage=personal --application=be/digest-canva --func=digestCanvaWebhook
```

## Run frontend locally

1. In `apps/fe/digest-canva` directory run the following command to start the frontend application:
    ```sh
    npm run start
    ```
2. In Canva application settings, set App source Development URL to `http://localhost:3000/static/js/bundle.js`.

3. Set Canva application Redirect URL to `https://api.[AWS_DOMAIN]/digest-canva/configuration/redirect`.

4. Set Canva application Authentication base URL  to `https://api.[AWS_DOMAIN]/digest-canva`.

5. In Canva integration settings, set Authorized redirect URL to `https://api.[AWS_DOMAIN]/digest-canva/auth`.

6. Run preview from Canva application settings.

## Build frontend
1. In `apps/fe/digest-canva` directory run the following command to build the frontend application:

    ```sh
    npm run build
    ```

2. In Canva application settings, upload file `apps/fe/digest-canva/build/static/js/bundle.min.js` as an App source
