import { Component } from "react";

class Boundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <>
      <a className="skip-link" href="#main-content">{this.props.skipToMain}</a>
      <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-gray-900">
        <section className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">{this.props.title}</h1>
          <p>{this.props.message}</p>
          <button className="btn-primary min-h-[44px]" type="button" onClick={() => window.location.reload()}>
            {this.props.reload}
          </button>
        </section>
      </main>
      </>
    );
  }
}

export default function ErrorBoundary({ children, text, skipToMain }) {
  return <Boundary title={text.title} message={text.message} reload={text.reload} skipToMain={skipToMain}>{children}</Boundary>;
}
