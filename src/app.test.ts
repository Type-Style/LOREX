import axios from 'axios';

describe('Server Status', () => {
  it('The server is running', async () => {
    var serverStatus;
    try {
      const response = await axios.get('http://localhost');
      serverStatus = response.status;
    } catch (error) {
      console.error(error);
    }

    expect(serverStatus).toBe(200);
  })
})