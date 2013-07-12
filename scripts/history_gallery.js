var gallery = document.getElementById("history_gallery");
var current_commit = null;

function addCommitToGallery(commit) {
  var new_div = document.createElement("div");
  new_div.setAttribute("id", commit.id);

  new_div.addEventListener("click", clickListener);

  gallery.appendChild(new_div);
}

function clickListener() {
  var id = this.getAttribute("id");
  Canvas.clear();
  renderCommit(id);
  setCurrentCommit(id);
}

function clearGallery() {
  gallery.innerHTML = null;
}

function setCurrentCommit(commit) {
  if (current_commit) {
    document.getElementById(current_commit).style.background = "#eee";
  }
  if (commit) {
    document.getElementById(commit).style.background = 'yellow';
  }
  current_commit = commit;
}

function updateCurrentCommit(commit) {
  if (current_commit == commits[head].parent_id) {
    setCurrentCommit(commit);
  }
}
