var gallery = document.getElementById("history_gallery");
var current_commit_id = null;

function addCommitToGallery(commit) {
  var new_div = document.createElement("div");
  new_div.setAttribute("id", commit.id);

  new_div.addEventListener("click", clickListener);

  gallery.appendChild(new_div);

  if (current_commit_id == repo.getHead().parent_id) {
    setCurrentCommit(commit.id);
  }
}

function clickListener() {
  var id = this.getAttribute("id");
  Canvas.clear();
  renderCommit(id);
  setCurrentCommit(id);
}

function clearGallery() {
  current_commit_id = null;
  gallery.innerHTML = null;
}

function setCurrentCommit(commit_id) {
  if (!commit_id) {
    return;
  }

  if (current_commit_id) {
    document.getElementById(current_commit_id).style.background = "gray";
  }
  document.getElementById(commit_id).style.background = 'yellow';
  current_commit_id = commit_id;
}
