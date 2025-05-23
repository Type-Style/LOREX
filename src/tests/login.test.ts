import axios, { AxiosError } from 'axios';
import qs from 'qs';

jest.setTimeout(10000);

const userDataLarge = qs.stringify({
  user: "user",
  password: "pass",
  kilobyte: 'BPSwVu5vcvhWB17HcfIdyQK83mHJZKChv7zDihBJoifWK9EJFzK7VYf3kUgIqkc0io8DnSdewzc9U0GpzodQUFz0KLMaogsJruEbNSKvxnzUxS5UqSR64lLOmGumoPcn2InC0Ebpqfdiw90HFVZVlE3AY6Lhgbx8ILHi55RvpuGefDjBsePgow8Jh9sc8uVMCDglLmHQ0zk3PumMj0KlOszbMmX9fG0pPUsvLLc40biPBv9t97K3BFjYd3fGriRAQ3bFhGHBz2wzGbNQfHjKFDHuSvXOw8KReM7Wwd4Cl02QQ3RnDJVwH6cayh4BqFRXlP3i6uXw0l9qxdTv0q1CtV9rJho6zwo04gkGLvsS3AoYJQtHnOtUDdHPExu7l3nMKnPoRUwl7K2ePfHRuppFGqa43Q49bI04VjEhrB9k5S2uZJoxZdm63rIUrydmkZWdvBLVVZUIXwwIRnwLmoa26htKOz9FPKwWIPOM0NZj4jAoPhKqLDJwziNZn5UupzxBXoUM3BIyEk3K8GXs7eBduH9GCK2z2HPF0fJNtGiHASe7jCOC2mhSC5zGf9k0Yu1Ey63oQQZUtT7L57lp7UzPE2p6wzKDlbJZOn0Ho5OUfq3hE2C8fQRO1M6jDvRTiUIKhhxSHYd75Pvh4SG9lD8w5OHASusLDxmzKBUuG4GrGrQYpd0awJkqnKp5lk7psLD22YTtjTuDgI500tQLXSslxI1kIuB8RnN1LsxHyRQMVtXmNFOKKZV2U2frWpImIz2wSHCYrwRGygwDtiFfwtVwTapjhQqUMyb1vrWWi3EL1Y50fDCjDDHlvLI4N2tr2DULFf3a9m2SYWSoE6CYP4og5YyqjhqFQFm9urREInyZi9L0iQoMYxEqxTjGiVJfKmaSChSd0kQz6z2OdsxFbkMWJ2CAHOL1XNK8iFFSp93fIspaNMIonRVDCj4ZIP1LaPHDmIYcYTNU4k3Uz6VBHSIc1VjiG3sc2MZpKw9An0tJVlWbtVSk2RGYWIANAYyr5pQS'
});
const userDataWithoutToken = qs.stringify({
  user: "user",
  password: "pass"
});

let csrfToken = "-";
const userDataWithToken = {
  user: "user",
  password: "pass",
  csrfToken: ""
};

describe('Login', () => {
  it('csrf available', async () => {
    let serverStatus = {};
    let response = { data: "", status: "" };
    try {
      response = await axios({
        method: "post",
        url: "http://localhost:80/login/csrf",
        headers: { 
          "content-type": "application/x-www-form-urlencoded",
          "x-requested-with": "XMLHttpRequest"
        }
      })
      serverStatus = response.status;
    } catch (error) {
      console.error(error);
      throw Error("fail");
    }


    expect(serverStatus).toBe(200);
    expect(response.data).toBeTruthy();
    const regex = /^[a-f0-9]{32}$/;
    expect(response.data).toMatch(regex);
    csrfToken = response.data;
    expect(csrfToken.length).toBeGreaterThan(30);
  })

  it('server is blocking requests with large body', async () => {
    try {
      await axios.post('http://localhost:80/login', userDataLarge);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(413);
      } else {
        console.error(axiosError);
      }
    }
  })

  it('invalid csrf shows correct error', async () => {
    try {
      await axios.post('http://localhost:80/login', userDataWithoutToken);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(403);
        if (axiosError.response.data) {
          expect(JSON.stringify(axiosError.response.data)).toContain('Invalid CSRF');
        } else {
          throw Error("fail");
        }
      } else {
        console.error(axiosError);
      }
    }
  })


  it('test invalid credentials to return error', async () => {
    try {
      userDataWithToken.csrfToken = csrfToken;
      await axios.post('http://localhost:80/login', qs.stringify(userDataWithToken));
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(403);
        if (axiosError.response.data) {
          expect(JSON.stringify(axiosError.response.data)).toContain('Invalid credentials');
        } else {
          throw Error("fail");
        }
      } else {
        console.error(axiosError);
      }
    }
  })
})
