function PrimaryButton({ children, style, onClickFunction }) {
  return (
    <button
      onClick={onClickFunction}
      className={`font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl ${style}`}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;