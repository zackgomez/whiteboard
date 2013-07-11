var gallery = document.getElementById("history_gallery");
var curr_selected = null;

function addCommitToGallery(commit) {
  var new_div = document.createElement("div");
  new_div.innerHTML = commit.id;
  new_div.setAttribute("id", commit.id);

  new_div.addEventListener("click", clickListener);

  gallery.appendChild(new_div);
}

function clickListener() {
  Canvas.clear();
  renderCommit(this.getAttribute("id"));
  if (curr_selected) {
    curr_selected.style.background = "#eee";
  }
  this.style.background = 'yellow';
  curr_selected = this;
}

function clearGallery() {
  gallery.innerHTML = null;
}
