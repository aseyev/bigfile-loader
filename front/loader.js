class Uploader {

  constructor({file, onProgress}) {
    this.file = file;
    this.onProgress = onProgress;

    // fileId, to idetify file for the server
    this.fileId = file.name + '-' + file.size + '-' + file.lastModified;
  }

  async getUploadedBytes() {
    let response = await fetch('http://127.0.0.1:8080/status', {
      headers: {
        'X-File-Id': this.fileId
      }
    });
    // console.log('uploader getUploadedBytes await response', response)

    if (response.status != 200) {
      throw new Error("Can't get uploaded bytes: " + response.statusText);
    }

    let text = await response.text();
    console.log('uploader getUploadedBytes await response.text():>>', text)
    return +text;
  }
  
  async upload() {
    this.startByte = await this.getUploadedBytes();
    
    console.log('uploader upload await this.startByte:>>', this.startByte)
    let xhr = this.xhr = new XMLHttpRequest();
    console.log("xhr1:>>", xhr);
    xhr.open("POST", "http://127.0.0.1:8080/upload", true);
    
    //  attach file id for the server 
    xhr.setRequestHeader('X-File-Id', this.fileId);
    // send the byte we're resuming from, so the server knows we're resuming
    xhr.setRequestHeader('X-Start-Byte', this.startByte);
    
    xhr.upload.onprogress = (e) => {
      this.onProgress(this.startByte + e.loaded, this.startByte + e.total);
    };
    
    console.log("send the file, starting from", this.startByte);
    xhr.send(this.file.slice(this.startByte));
    
    // return
    //   true if upload was successful,
    //   false if aborted
    // throw in case of an error
    return await new Promise((resolve, reject) => {
      
      console.log("xhr2:>>", xhr);
      xhr.onload = xhr.onerror = () => {
        console.log("upload end status:" + xhr.status + " text:" + xhr.statusText);

        if (xhr.status == 200) {
          resolve(true);
        } else {
          reject(new Error("Upload failed: " + xhr.statusText));
        }
      };

      // onabort triggers only when xhr.abort() is called
      xhr.onabort = () => resolve(false);

    });

  }

  stop() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

}