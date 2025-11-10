chown -R www-data. ximpul.com
chmod -R +x ximpul.com
cd ximpul.com
chmod +x node_modules/@esbuild/linux-x64/bin/esbuild
pm2 stop all
npm run build

pm2 list
pm2 start email-server.js --name email-server
pm2 start sslcommerz-payment.js --name sslcommerz-server
pm2 start "npx serve -s dist -p 8080 -L" --name ximpul-app

pm2 list

if needed restart 
pm2 restart ximpul-app
pm2 restart email-server
pm2 restart sslcommerz-server
