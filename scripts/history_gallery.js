var gallery = document.getElementById("history_gallery");
var curr_selected = null;

function addCommitToGallery(commit) {
  var new_li = document.createElement("li");
  new_li.innerHTML = commit.id;
  new_li.setAttribute("id", commit.id);

  new_li.addEventListener("click", clickListener);

  gallery.appendChild(new_li);
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
