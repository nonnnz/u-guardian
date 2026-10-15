import http from 'node:http';
import {createApplication} from './application.mjs';
const app=await createApplication();
const port=Number(process.env.PORT||4173),phonePort=Number(process.env.PHONE_PORT||4175);
http.createServer(app.handler).listen(port,'127.0.0.1',()=>console.log('U-Guardian POC ready at http://127.0.0.1:'+port));
http.createServer(app.callback).listen(phonePort,'127.0.0.1',()=>console.log('Phone callback listener ready on 127.0.0.1:'+phonePort));
app.monitor();
