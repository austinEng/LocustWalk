'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Optional from '~/common/frontend/components/optional';
import TypeaheadInput from './typeahead-input';
import moment from 'moment';
import {getFileURL} from '~/common/frontend/helpers/file';
import $ from 'jquery';
import {graphql, gql} from 'react-apollo';

const PARENT_QUERY = gql`
  query ParentQuery($_id: ObjectID!) {
    article(_id: $_id) {
      _id
      title
    }
  }
`;

const ResponseToInput = graphql(PARENT_QUERY, {
  skip(props) {
    return !props.article.parent;
  },
  options(props) {
    return {
      variables: {
        _id: props.article.parent,
      },
    };
  },
  props({ ownProps, data: { loading, article }}) {
    return {
      loading,
      parent: article || {},
      children: ownProps.children,
    };
  },
})( ({children, parent}) => {
  if (Array.isArray(children)) {
    return children.map(child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {parent});
      } else {
        return child({parent});
      }
    });
  } else {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {parent});
    } else {
      return children({parent});
    }
  }
});

export default class ArticleEditPanel extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const article = this.props.article || {};
    this.originalDate = article.date;

    this.setState({
      dateNow: !article.is_published,
      date: new Date(),
    });
  }

  componentDidMount() {
    this.timerID = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: new Date(),
    });
  }

  dateNowToggled(event) {
    this.setState({
      dateNow: event.target.checked,
    });
  }

  handleImageChange(prop, event) {
    var file = event.target.files[0];
    var blob = '';
    if (file) {
      blob = URL.createObjectURL(file);
    }
    this.props.stage.update(prop, blob);
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.props.getArticleContent) {
      const articleContent = this.props.getArticleContent();
      this.props.stage.update('content', articleContent, () => {
        this.props.submit().then(this.props.onSubmit);
      });
    } else {
      this.props.submit().then(this.props.onSubmit);
    }
  }

  handleCancel(event) {
    if (!this.props.stage.hasChangedFields() || confirm(`Are you sure you want to cancel editing "${this.props.stage.values.title}"? Unsaved changes will be lost!`)) {
      this.props.cancel(this.props.onCancel);
    }
  }

  handleDelete(event) {
    if (confirm(`Are you sure you want to delete "${this.props.stage.values.title}?"`)) {
      this.props.delete().then(this.props.onDelete);
    }
  }

  syncArticle(event) {
    event.preventDefault();
    const docId = event.target.elements['doc-id-input'].value;
    if (docId && confirm('Content on this page will be replaced. Are you sure?')) {
      $.post(`/admin/articles/docs/sync/${docId}`, (content) => {
        this.props.stage.update('content', content);
      });
    }
  }

  render() {
    const article = this.props.stage.values;

    return (
      <div className="admin-sidebar">
          <style dangerouslySetInnerHTML={{__html: `
            .twitter-typeahead {
              display: block!important;
            }

            .tt-dropdown-menu {
              width: 100%;
              & > div {
                padding: 5px;
                border-radius: 5px;
                box-shadow: 0 0 10px 0 black;
                background-color: white;
              }
            }
            .tt-suggestion {
              padding: 2px 10px;
              line-height: 24px;
              color: #333;
              p {
                margin: 0;
              }
            }

            .tt-suggestion.tt-cursor,.tt-suggestion:hover {
              color: #fff;
              background-color: #0097cf;
            }

            .tt-hint {
              color: #999
            }

            .tt-menu {
              width: 100%;
              background-color: white;
              border: 1px solid gray;
            }
          `}} />
          <Optional test={this.props.gdriveSync}>
            <form className="form" action="sync" method="POST" onSubmit={this.syncArticle.bind(this)}>
                <div className="form-group">
                    <label>Pull from Google Drive</label>
                    <TypeaheadInput
                      className="form-control" placeholder="Document Title"

                      typeaheadConfig={{
                        hint: true,
                        highlight: true,
                        minLength: 1,
                        display: 'name',
                      }}

                      createBloodhoundConfig={function(Bloodhound) {
                        return new Bloodhound({
                          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
                          queryTokenizer: Bloodhound.tokenizers.whitespace,
                          remote: {
                            url: '/admin/articles/docs/search?name=%QUERY',
                            wildcard: '%QUERY',
                          },
                        });
                      }}

                      target="#doc-id-input"
                      targetField="id"
                    />
                    <input className="form-control" id="doc-id-input" name="doc_id" placeholder="Document ID" readOnly />
                </div>
                <div className="form-group">
                    <button className="btn btn-default" type="submit">Sync</button>
                </div>
            </form>
          </Optional>
          <form onSubmit={this.handleSubmit.bind(this)} className="form" key={article._id}>
              {this.props.getArticleContent ? <input type="hidden" name="content" /> : null }

              <div className="form-group">
                  <label>Title</label>
                  <input type="text" className="form-control"
                    placeholder="Article Title"
                    value={article.title}
                    onChange={e => this.props.stage.update('title', e.target.value)}
                  />
              </div>

              <div className="form-group">
                  <label>Author</label>
                  <input type="text" className="form-control"
                    placeholder="Author"
                    value={article.author}
                    onChange={e => this.props.stage.update('author', e.target.value)}
                  />
              </div>

              <div className="form-group">
                  <div className="checkbox">
                      <label className="checkbox-inline">
                          <input type="checkbox"
                            checked={article.is_featured || false}
                            onChange={e => this.props.stage.update('is_featured', e.target.checked) }
                           />
                          Featured
                      </label>
                      <label className="checkbox-inline">
                          <input type="checkbox"
                            checked={article.is_published || false}
                            onChange={e => this.props.stage.update('is_published', e.target.checked) }
                          />
                          Published
                      </label>
                  </div>
              </div>

              <div className="form-group">
                  <label>Cover Photo</label>
                  <Optional test={this.props.imagePreviews}>
                      <img
                        style={{maxWidth: '200px', display: 'block'}}
                        src={article.cover ? getFileURL(article.cover, article.cover_preview_img) : ''}
                      />
                  </Optional>
                  <input type="file" accept="image/*" onChange={this.handleImageChange.bind(this, 'cover_preview_img')} />
              </div>

              <div className="form-group">
                  <label>Thumbnail</label>
                  <Optional test={this.props.imagePreviews}>
                      <img
                        style={{maxWidth: '200px', display: 'block'}}
                        src={article.thumb ? getFileURL(article.thumb, article.thumb_preview_img) : ''}
                      />
                  </Optional>
                  <input type="file" accept="image/*" onChange={this.handleImageChange.bind(this, 'thumb_preview_img')} />
              </div>

              <div className="form-group">
                  <label htmlFor="slug-input">Slug</label>
                  <input id="slug-input" name="slug" type="text" className="form-control" placeholder="Slug"
                      value={article.slug}
                      onChange={ e => this.props.stage.update('slug', e.target.value) } />
              </div>

              <div className="form-group">
                  <label>Response To</label>
                  <ResponseToInput article={article}>
                    {({parent}) => {
                      parent = parent || {};
                      return (
                        <TypeaheadInput key={parent._id} type="text" className="form-control" placeholder="Response To..." defaultValue={parent.title}

                          typeaheadConfig={{
                            hint: true,
                            highlight: true,
                            minLength: 1,
                            display: 'title',
                          }}

                          createBloodhoundConfig={function(Bloodhound) {
                            return new Bloodhound({
                              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
                              queryTokenizer: Bloodhound.tokenizers.whitespace,
                              remote: {
                                url: '/admin/articles/search?title=%QUERY',
                                wildcard: '%QUERY',
                              },
                            });
                          }}

                          target={ value => { this.props.stage.update('parent', value); } }
                          targetField="_id"
                        />
                      );
                    }}
                  </ResponseToInput>
                  <input type="text" readOnly className="form-control" placeholder="Article ID" value={article.parent || ''} />
              </div>

              </div>
              <div className="form-group">
                  <label>Post Date</label>
                  <input type="text" className="form-control"
                    disabled={this.state.dateNow}
                    onChange={ e => this.props.stage.update('date', moment(e.target.value || this.originalDate))}
                    placeholder={moment(this.state.dateNow ? this.state.date : article.date).format('MMM DD, YYYY [at] H:mm:ss')}
                  />
                  <div>
                    <span>{moment(this.state.dateNow ? this.state.date : article.date).format('MMM DD, YYYY [at] H:mm:ss')}</span>
                    <span className="pull-right">
                      <span className="checkbox" style={{margin: 0}}>
                          <label className="checkbox-inline">
                              <input type="checkbox" checked={this.state.dateNow} onChange={this.dateNowToggled.bind(this)} /> Now
                          </label>
                      </span>
                    </span>
                  </div>
                  <input id="date-input" name="date" type="hidden" className="form-control"
                      value={moment(this.state.dateNow ? this.state.date : article.date).format('MMM DD, YYYY [at] H:mm:ss')} />

              </div>
              <div className="form-group">
                  <label>Heading Override</label>
                  <input type="text" className="form-control"
                    onChange={ e => this.props.stage.update('heading_override', e.target.value) }
                    placeholder={moment(this.state.dateNow ? this.state.date : article.date).format('MMM YYYY [Feature Article]')}
                  />
                  <input name="heading_override" type="hidden" className="form-control"
                    value={article.heading_override || moment(this.state.dateNow ? this.state.date : article.date).format('MMM YYYY [Feature Article]')}
                  />
              </div>
              <div className="btn-toolbar">
                <button className="btn btn-primary" type="submit">Save</button>
                <a className="btn btn-default" onClick={this.handleCancel.bind(this)}>Cancel</a>
                <a className="btn btn-danger pull-right" onClick={this.handleDelete.bind(this)}>Delete</a>
              </div>
          </form>
      </div>
    );
  }
}

ArticleEditPanel.propTypes = {
  stage: PropTypes.object.isRequired,
  submit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  delete: PropTypes.func.isRequired,
};

