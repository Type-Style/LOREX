import axios from 'axios';
import qs from 'qs';

// random data of 0.75Kb pre GZIP
const randomData = qs.stringify({ 
  randomData: 'zIakHvSaXDdLtaPaL02LhGr4Fk6hzXF7tELeR733YZyyye1fnjNzrSlHgqcHU8BKqvE5Mi4B7iHIEdqjTelpoWyaqXqX8l6LzOvROAkTF4lrLXLD1oMHwDL9hnjR0P7g0BB2DqagKkoEYD4TmXeAXT9PbevbirWnOEzmIgSv65SlsNTRFYhmzWl93twXEBNclHTCTnZpf6diWoo8FsXZR49pe9v8J1paalh2LlbNF4ZUxMxNpSvSTRHxvkYo0TMpd0NqUSSLduLIWcE1jhCWnmHhsbohDZjFfMhVS8IFvCiu7rxfuWgwMPqD9FcBR79eqJBy2tjDMqA9S1k9k50AkbOQ6USVfEuqOtocqXonTvC3Jml90KYSs0gX4SSTFHofpMtbWIdkuKqZbitQjsPSBpTx27dhFZd8zT4erdE1ltHnq83pjEj9hQYqatmdzQGYnOyh9YDt8i1IJpk4DX83DLzw3QhaFPgZFq98SOj4ILytmBMIqOtD464aF8PKGq6g7dVqYOtyF2FwyY0xgA7LjGaFzaCDjnGEcPIMRc2tcorsuRPKUI0zcde1gYPsn4WKaKUp87hJd1YtorzCXPfvivfGGL5v1XaSzApc9BbZpbxcpTOi4Pgvx7hNafUcaCr6kcjp4JVYSktnnGCwEplgGEF8uCELsEBUi9LNhgsnwgoRh55TaJfcaFfGfYLokXYEgiyOwYhhdEY3kfjHZWAyFS4owCR6nMJGOGMHrQi1fBefdp28PQGwgELix5Vf8j6P'
});

describe('Server Status', () => {
  it('The server is running', async () => {
    let serverStatus;
    let response;
    try {
      response = await axios.get('http://localhost:80/');
      serverStatus = response.status;
    } catch (error) {
      console.error(error);
      return;
    }

    expect(serverStatus).toBe(200);
    expect(response.data).toContain("js/bundle.js");
  })

  it('bundle.js exists', async () => {
    let serverStatus;
    let response;
    try {
      response = await axios.get('http://localhost:80/js/bundle.js');
      serverStatus = response.status;
    } catch (error) {
      console.error(error);
    }

    expect(serverStatus).toBe(200);
  })

  it('server is ignoring body on GET requests', async () => {
    let serverStatus;
    try {
      const response = await axios.request({
        url: 'http://localhost:80/',
        method: 'GET',
        data: randomData,
      });
      serverStatus = response.status;
    } catch (error) {
      console.error(error);
    }

    expect(serverStatus).toBe(200);
  })
  
})




