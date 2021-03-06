import React, { Component } from 'react';

import UploadManager from './UploadManager.js';
import Emojione from 'components/Emojione/Emojione.js';
import './Uploads.scss';
import Languages from 'services/languages/languages.js';

export default class UploadZone extends React.Component {
  constructor(props) {
    super();
    this.state = {
      upload_manager: UploadManager,
    };
    UploadManager.addListener(this);
    this.paste = this.paste.bind(this);
  }
  componentWillUnmount() {
    UploadManager.removeListener(this);
    window.document.removeEventListener('paste', this.paste);

    if (this.file_input) {
      document.body.removeChild(this.file_input);
    }
  }
  componentDidMount() {
    this.watch(this.node);

    this.file_input = document.createElement('input');
    this.file_input.type = 'file';
    this.file_input.style.position = 'absolute';
    this.file_input.style.top = '-10000px';
    this.file_input.style.left = '-10000px';
    this.file_input.style.width = '100px';
    if (this.props.multiple !== false) {
      this.file_input.multiple = true;
    }

    this.file_input.onchange = e => {
      this.change(e);
    };

    document.body.appendChild(this.file_input);
  }
  open() {
    if (this.props.disabled) {
      return;
    }

    this.file_input.click();
  }
  upload(tree, nb, totalSize) {
    if (this.props.multiple === false) {
      nb = 1;
      var file = null;
      Object.keys(tree).every(i => {
        var element = tree[i];
        if (element.size) {
          file = {};
          file[i] = element;
          totalSize = element.size;
          return false;
        }
        return true;
      });
      if (!file) {
        return;
      }
    }
    UploadManager.startUpload(
      tree,
      nb,
      totalSize,
      this.props.parent,
      this.props.uploadOptions,
      this.props.driveCollectionKey,
      this.props.onUploaded
    );
  }
  change(event) {
    if (this.props.disabled) {
      return;
    }

    event.preventDefault();

    this.hover(false);

    UploadManager.getFilesTree(event, (tree, nb, totalSize) => {
      this.upload(tree, nb, totalSize);
    });
  }
  watch(node, cb) {
    node.addEventListener('dragover', e => {
      e.preventDefault();
      this.hover(true, e);
    });
    node.addEventListener('dragenter', e => {
      if (this.props.onDragEnter) {
        this.props.onDragEnter();
      }
      this.hover(true, e);
      e.preventDefault();
    });
    node.addEventListener('dragleave', e => {
      if (this.props.onDragLeave) {
        this.props.onDragLeave();
      }
      this.hover(false);
    });
    node.addEventListener('drop', e => this.change(e));

    window.document.addEventListener('paste', this.paste);
  }
  paste(event) {
    if (this.props.allowPaste) {
      var clipboardData = event.clipboardData || event.originalEvent.clipboardData;
      var items = clipboardData.items;
      var filename = (clipboardData.getData('Text') || 'image').split('\n')[0];
      filename = filename.replace(/\.(png|jpeg|jpg|tiff|gif)$/i, '');

      var types = [],
        hasImage = false,
        imageBlob = false,
        imageType = false;

      for (var index in items) {
        var item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          hasImage = true;
          imageBlob = item.getAsFile();
          imageType = item.type;
        }
        types.push(item.type);
      }

      if (hasImage && !types.indexOf('text/rtf') && !types.indexOf('text/html')) {
        event.preventDefault();
        event.stopPropagation();

        var blob = imageBlob.getAsFile();
        filename = filename + '.' + (imageType.split('/')[1] || 'png');
        var file = new File([blob], filename, { type: imageType });
        var list = {};
        list[filename] = file;
        this.upload(list, 1, file.size);
      }
    }
  }
  hover(state, event) {
    if (
      !this.state.dragover &&
      (!event || !event.dataTransfer || (event.dataTransfer.types || []).indexOf('Files') < 0)
    ) {
      return;
    }
    if (!state) {
      this.stopHoverTimeout = setTimeout(() => {
        this.setState({ dragover: false });
      }, 200);
      return;
    }
    if (this.stopHoverTimeout) clearTimeout(this.stopHoverTimeout);
    this.setState({ dragover: state });
  }
  render() {
    return (
      <div
        style={this.props.style}
        className={'upload_drop_zone ' + this.props.className}
        ref={node => (this.node = node)}
        onClick={event => {
          if (!this.props.disableClick) {
            this.open();
          }
        }}
      >
        <div className={'onDragOverBackground ' + (this.state.dragover ? 'dragover ' : '')}>
          <div className="dashed">
            <div className={'centered ' + (this.state.dragover ? 'skew_in_top ' : '')}>
              <Emojione type=":page_facing_up:" s128 />
              <div className="title">
                {Languages.t('components.upload.upload_doc', [], 'Envoyer des documents')}
              </div>
              <div className="text">
                {Languages.t(
                  'components.upload.drop_files',
                  [],
                  'Relachez vos fichiers pour les télécharger.'
                )}
              </div>
            </div>
          </div>
        </div>

        {this.props.children}
      </div>
    );
  }
}
