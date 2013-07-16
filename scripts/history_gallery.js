function Gallery() {
  this._galleryElem = document.getElementById("history_gallery");
  this._selectedCommitId = null;

  this.addCommit  = function(commit) {
    var new_div = document.createElement("div");
    new_div.setAttribute("id", commit.id);

    new_div.addEventListener("click", clickListener);

    this._galleryElem.appendChild(new_div);

    if (this._selectedCommitId == repo.getHead().parent_id) {
      this.selectCommit(commit.id);
    }
  }

  this.clearGallery = function() {
    this._selectedCommitId = null;
    this._galleryElem.innerHTML = null;
  }

  this.selectCommit = function(commit_id) {
    if (!commit_id) {
      return;
    }

    if (this._selectedCommitId) {
      document.getElementById(this._selectedCommitId).style.background = "gray";
    }
    document.getElementById(commit_id).style.background = 'yellow';
    this._galleryElem.scrollLeft = this._galleryElem.scrollWidth;

    this._selectedCommitId = commit_id;
  }
}

function clickListener() {
  var id = this.getAttribute("id");
  Canvas.clear();
  renderCommit(id);
  gallery.selectCommit(id);
}

