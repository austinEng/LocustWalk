'use strict';

import {Component} from 'react';
import PropTypes from 'prop-types';
import {compose, graphql} from 'react-apollo';
import { editingContext } from './editing-context';
import {ARTICLE_QUERY} from '../gql/queries';
import {ARTICLE_NEW, ARTICLE_UPDATE, ARTICLE_DELETE} from '../gql/mutations';

const editableArticleFields = [
  'title',
  'content',
  'slug',
  'author',
  'date',
  'is_published',
  'cover_file',
  'thumb_file',
  'parentID',
  'topicID',
];

class ArticleEdit extends Component {
  render() {
    return !this.props.children ? null : this.props.children(this.props);
  }
}

ArticleEdit.propTypes = {
  children: PropTypes.func,
};

function getInputKey(key) {
  switch (key) {
    case 'topicID':
      return 'topic';
    case 'parentID':
      return 'parent';
    default:
      return key;
  }
}

export default compose(
  graphql(ARTICLE_QUERY, {
    skip(props) {
      return !props._id;
    },
    options(props) {
      return {
        variables: {
          _id: props._id,
        },
      };
    },
    props({ data: { loading, article } }) {
      return {
        article,
        loading,
      };
    },
  }),
  graphql(ARTICLE_NEW, {
    name: 'newArticle',
    props({newArticle}) {
      return {
        newArticle: (article) => newArticle({
          variables: {
            article,
          },
        }),
      };
    },
  }),
  graphql(ARTICLE_UPDATE, {
    name: 'updateArticle',
    props({ownProps, updateArticle}) {
      return {
        updateArticle: (article) => updateArticle({
          variables: {
            _id: ownProps._id,
            article,
          },
        }),
      };
    },
  }),
  graphql(ARTICLE_DELETE, {
    name: 'deleteArticle',
    props({ownProps, deleteArticle}) {
      return {
        deleteArticle: () => deleteArticle({
          variables: {
            _id: ownProps._id,
          },
        }),
      };
    },
  }),
  editingContext({
    createStage({article = {}}, stage = {}) {
      if (!article || !article._id) {
        return {};
      } else if (article._id !== stage._id) {
        return Object.assign({}, article);
      } else {
        return Object.assign({}, article, stage);
      }
    },
    props(ownProps, stage) {
      return {
        submit() {
          const isNew = !stage.values._id;

          const params = stage.getChangedFields()
            .filter(key => editableArticleFields.includes(key))
            .reduce((obj, key) => {
              obj[getInputKey(key)] = stage.values[key];
              return obj;
            }, {});

          if (isNew) {
            return ownProps.newArticle(params);
          } else {
            return ownProps.updateArticle(params);
          }
        },
        cancel(cb) {
          stage.clear(cb);
        },
        delete() {
          return ownProps.deleteArticle();
        },
      };
    },
  }),
)(ArticleEdit);
