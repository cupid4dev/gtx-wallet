import { connect } from 'react-redux'
import Identicon from './identicon.component'

const mapStateToProps = (state) => {
  const { metamask: { useBlockie, network } } = state

  return {
    useBlockie,
    network,
  }
}

export default connect(mapStateToProps)(Identicon)
