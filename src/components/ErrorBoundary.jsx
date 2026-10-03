import { Component } from 'react';

/** Prevents one broken page from white-screening the whole app. */
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
        <h2 className="text-lg font-semibold text-white">Something went wrong on this page</h2>
        <p className="text-sm text-white/50 max-w-sm">The rest of ConceptFlow is still working. Try again or head back to the overview.</p>
        <div className="flex gap-3">
          <button onClick={() => this.setState({ error: null })} className="px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-white/90 transition-colors">Try again</button>
          {this.props.onHome && <button onClick={this.props.onHome} className="px-4 py-2 border border-white/10 text-white/70 text-[13px] rounded-md hover:bg-white/5 transition-colors">Go to overview</button>}
        </div>
      </div>
    );
  }
}
