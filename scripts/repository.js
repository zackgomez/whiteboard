function Repository(commits, head_commit_id) {
  this._commits = commits;
  this._head_commit_id = head_commit_id;

  this.traverseCommits = function (commit_id, callback) {
    if (commit_id === null) {
      return;
    }
    var commit = commits[commit_id];
    if (!commit) {
      throw new Error('commit id ' + commit_id + ' not found');
    }

    this.traverseCommits(commit.parent_id, callback);
    callback(commit);
  }

  this.getCommits = function () {
    return this._commits;
  }
  
  this.getCommit = function (commit_id) {
    return this._commits[commit_id];
  }

  this.getHeadId = function () {
    return this._head_commit_id;
  }

  this.getHead = function () {
    if (!this._head_commit_id) {
      return null;
    }
    return this._commits[this._head_commit_id];
  }

  this.reset = function () {
    this._commits = {};
    this._head_commit_id = null;
  }

  this.setHead = function (commit_id) {
    if (!(commit_id in this._commits)) {
      return;
    }
    this._head_commit_id = commit_id;
  }

  this.containsCommit = function(commit_id) {
    return commit_id in this._commits;
  }

  this.appendCommit = function (new_commit) {
    var old_head = this._head_commit_id;
    new_commit.parent_id = old_head;
    this._head_commit_id = new_commit.id;

    this._commits[this._head_commit_id] = new_commit;
    return new_commit;
  }

  this.addCommit = function (commit) {
    this._commits[commit.id] = commit;
  }

  this.updateCommitData = function (commit_id, data) {
    if (!(commit_id in this._commits)) {
      return;
    }

    this._commits[commit_id].data = data;
  }
}

if (typeof window === "undefined") {
  module.exports = Repository;
}
