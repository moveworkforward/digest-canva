export const baseTemplate = () => `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Move Work Forward</title>

        <style>
            html,
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
                font-size: 14px;
            }
        </style>
    
    </head>
    <body>
        <input type="hidden" id="loginUrl" value="{{loginUrl}}">
        <div id="root"></div>       
        {{#each scriptUrls}}
            <script type="text/javascript" src="{{this}}"></script>
        {{/each}}
    </body>
</html>
`;
