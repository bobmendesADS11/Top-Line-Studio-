import React from 'react';

type State = { hasError: boolean };

// Mostra uma tela amigável quando um componente quebra, em vez de apagar o site inteiro.
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Erro na interface:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-10 font-sans">
        <h1 className="text-brand-gold text-2xl font-bold mb-3">Ops! Algo deu errado.</h1>
        <p className="text-gray-400 mb-6">Recarregue a página para continuar. Se o problema persistir, fale com a equipe Top Line.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-brand-gold text-black px-6 py-3 rounded-full font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
