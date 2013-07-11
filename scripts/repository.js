function Repository() {
  this.commits = {};
  this.head_commit_id = null;

  this.traverseCommits = function (commit_id, callback) {
    if (commit_id === null) {
      return;
    }
    var commit = commits[commit_id];
    if (!commit) {
      throw new Error('commit id ' + commit_id + ' not found');
    }

    traverseCommits(commit.parent_id, callback);
    callback(commit);
  }

  this.getCommits = function () {
    return this.commits;
  }
  
  this.getCommit = function (commit_id) {
    return this.commits[commit_id];
  }

  this.getHead = function () {
    return this.head_commit_id;
  }

  this.reset = function () {
    this.commits = {};
    this.head_commit_id = null;
  }

  this.setHead = function (commit_id) {
    if (!(commit_id in this.commits)) {
      return;
    }
    this.head_commit_id = commit_id;
  }

  this.appendCommit = function (new_commit) {
    var old_head = this.head_commit_id;
    new_commit.parent_id = old_head;
    this.head_commit_id = new_commit.id;

    this.commits[this.head_commit_id] = new_commit;
    return new_commit;
  }

  this.updateCommitData = function (commit_id, data) {
    if (!(commit_id in this.commits)) {
      return;
    }
    this.commits[commit_id].data = data;
  }
}

module.exports = Repository;
