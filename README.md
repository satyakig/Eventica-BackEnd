# Web Based Systems - Winter 2020 - Final Project

## Group 12, Eventica

### Back End application

- GitHub: [https://github.com/satyakig/SENG-513-BackEnd](https://github.com/satyakig/SENG-513-BackEnd)
- Deployed Project: [https://seng-513.appspot.com/](https://seng-513.appspot.com/)

## Setup

- Install NodeJS v12 from [https://nodejs.org/en/download/releases/](https://nodejs.org/en/download/releases/)
- Clone the GitHub repo
- Use a terminal and navigate to the project root directory
- Run `npm install` or `npm ci` to install the project dependencies
- Run `npm run watch` to start the application locally
- Application will start on `https://localhost:3001`

### IDE Integration

1. WebStorm: https://prettier.io/docs/en/webstorm.html
2. VSCode: Install the `eslint` and `prettier` plugins. Add these configurations to your settings

   ```
   "editor.formatOnSave": true,
   "eslint.format.enable": true,
   "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
   },
   ```

## Available Scripts

In the project directory, you can run:

### `npm run watch`

Runs the server in the development watch mode. Server will recompile on file changes automatically.

### `npm run build`

Builds the app for production to the `build` folder.<br>
Your app is ready to be deployed!

## Code Style

This project uses [eslint](https://eslint.org) and [prettier](https://prettier.io) for linting and formatting JavaScript code. <br>

By default, all the linters run in pre-commit hooks to ensure that code is following the expected style guidelines <br>
before it is committed.

The following scripts are included: <br>

- `npm run lint`: Runs the linting tools and outputs and violations to the console
- `npm run lint:fix`: Same as above, but will attempt to fix any violations. Note <br>
  that eslint cannot fix some errors. Any errors that are not fixed will be displayed <br>
  in the console.
