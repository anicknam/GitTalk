import { ajax } from 'jquery';
import * as bluebird from 'bluebird';

function _get(url) {
  return ajax({
    url: url,
    method: 'GET',
    dataType: 'JSON'
  });
}

function _post(url, data) {
  return ajax({
    url: url,
    method: 'POST',
    data: data
  });
}

function getUser() {
  return new Promise((resolve, reject) => {
    _get('/auth/user').done(data => {
      resolve(data);
    }).fail((jqXHR, textStatus, err) => {
      reject(err);
    });
  });
}

function getUserReposCached() {
  return new Promise((resolve, reject) => {
    _get('/cached/user/repos')
      .done(data => resolve(data))
      .fail((_, text, err) => reject(err));
  });
}

function getRepoParentCached(repo) {
  return new Promise((resolve, reject) => {
    _get(`/cached/${repo}`)
      .done(data => resolve(data))
      .fail((x, t, err) => reject(err));
  });
}

function getUserRepos() {
  return new Promise((resolve, reject) => {
    _get('/auth/user').done(data => {
      const reposUrl = JSON.parse(data)._json.repos_url;
      _get(`${reposUrl}?per_page=100`)
      .done(repos => {
        resolve(repos);
      }).fail((jqXHR, textStatus, err) => {
        reject(err);
      });
    }).fail((jqXHR, textStatus, err) => {
      reject(err);
    });
  });
}

function getRepoInfoCached() {
  return new Promise((resolve, reject) => {
    getUserReposCached().then(data => {
      const repos = JSON.parse(data);
      let repoLinks = {};
      const p = repos.forEach(repo => {
        return new Promise((res, rej) => {
          getRepoParentCached(repo.full_name).then(r => {
            console.log(r);
            if (r.fork === true) {
              repoLinks[r.id] = r.parent.full_name;
            } else {
              repoLinks[r.id] = r.full_name;
            }
            res();
          }).catch(err => rej(err));
        });
        Promise.all(p).then(() => resolve(repoLinks)).catch(reject());
      });
    }).catch(err => console.log(err));
  });
}

function getRepoInfo() {
  return new Promise((resolve, reject) => {
    _get('/auth/user').done(data => {
      const reposUrl = JSON.parse(data)._json.repos_url;
      _get(`${reposUrl}?per_page=100`)
        .done(repos => {
          let repoLinks = {};
          // create an array of promises
          const p = repos.map(repo => {
            return new Promise((res, rej) => {
              let currentRepoLink = repo.url;
              _get(`${currentRepoLink}`).done(repo => {
                if (repo.fork === true) {
                  repoLinks[repo.id] = repo.parent.full_name;
                } else {
                  repoLinks[repo.id] = repo.full_name;
                }
                res();
              }).fail((jqXHR, textStatus, err) => {
                rej(err);
              });
            });
          });
          Promise.all(p).then(() => {resolve(repoLinks);}).catch(reject);
        }).fail((jqXHR, textStatus, err) => {
          reject(err);
        });
    }).fail((jqXHR, textStatus, err) => {
      reject(err);
    });
  });
}

function getMemberRepos(username) {
  return new Promise((resolve, reject) => {
    _get(`/api/memberrepos/${username}`).done(channels => {
      const repoNames = channels.reduce((names, channel) => names.concat([channel.id]), []);
      resolve(repoNames);
    }).fail((jqXHR, textStatus, err) => {
      reject(err);
    });
  });
}

export {
  getUser,
  getUserRepos,
  getUserReposCached,
  getMemberRepos,
  getRepoInfo,
  getRepoInfoCached
};

