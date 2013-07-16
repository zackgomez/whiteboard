function Repository(commits, head) {
  this._commits = commits;
  this._head_commit_id = head;
  this._leaves = null;

  this.findNumChildren = function() {
    var num_children = {};
    for (var commit in this._commits) {
      var parent_id = this._commits[commit].parent_id;
      if (num_children[parent_id]) {
        num_children[parent_id]++;
      } else if (parent_id) {
        num_children[parent_id] = 1;
      }
    }

    return num_children;
  }

  this.findLeaves = function() {
    var num_children = this.findNumChildren();
    var leaves = [];
    for (var commit in this._commits) {
      if (!num_children.hasOwnProperty(commit)) {
        leaves.push(commit);
      }
    }
    return leaves;
  }

  this.addBranch = function(commit) {
    this.addCommit(commit);
    this._leaves.push(commit.id);
  }

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

  // mutates the commit!
  this.appendCommit = function (new_commit) {
    new_commit.parent_id = this._head_commit_id;
    this._head_commit_id = new_commit.id;

    this._commits[this._head_commit_id] = new_commit;
  }

  this.branch = function (new_commit) {
    this._commits[new_commit.id] = new_commit;
    this._branch_commit_ids.push(new_commit);
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

  this._leaves = this.findLeaves();
}

if (typeof window === "undefined") {
  module.exports = Repository;
}
