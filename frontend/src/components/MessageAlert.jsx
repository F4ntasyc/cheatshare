export default function MessageAlert({ message, setMessage }) {
  return (
    <div role="alert" className="alert">
      {message} <button onClick={() => setMessage('')}>×</button>
    </div>
  );
}
