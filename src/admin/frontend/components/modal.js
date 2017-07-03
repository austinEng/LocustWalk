'use strict';

import React, {Component} from 'react';
import Optional from '~/common/frontend/components/optional'
import classnames from 'classnames';

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: props.isOpen,
      isHidden: true,
    };
  }
  
  componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen != this.state.isOpen) {
      this.setState({
        isOpen: nextProps.isOpen,
        isHidden: false,
      });
    }
  }
  
  render() {
    
    if (!this.state.isOpen && !this.state.isHidden) {
      setTimeout(() => {
        this.setState({
          isHidden: true,
        })
      }, 300);
    }
    
    return (
      <div className={classnames({
        'modal-open': !this.state.isHidden,
      })}>
        <div className={classnames('modal fade', {
          'in': this.state.isOpen,
        })} style={{
          display: !this.state.isHidden ? 'block' : 'none',
        }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" onClick={() => {this.setState({isOpen: false})}}><span>&times;</span></button>
                <Optional test={this.props.title}>
                  <h4 className="modal-title">{this.props.title}</h4>
                </Optional>
              </div>
              <div className="modal-body">
                {this.props.children}
              </div>
              <div className="modal-footer">
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
}

export default Modal;