import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "./ToastContainer";

const errorMessages = {
  not_authenticated: "Musisz być zalogowany, aby połączyć konta.",
  oauth_failed: "Błąd podczas autoryzacji OAuth. Spróbuj ponownie.",
  userinfo_failed: "Błąd podczas pobierania informacji o użytkowniku.",
  invalid_response: "Nieprawidłowa odpowiedź z serwera OAuth.",
  already_connected: "To konto jest już połączone z Twoim profilem.",
  account_exists: "To konto jest już połączone z innym użytkownikiem.",
  email_already_used: "Ten adres email jest już używany przez innego użytkownika.",
};

export default function OAuthErrorHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const message = errorMessages[error] || "Wystąpił błąd podczas łączenia kont.";
      showToast(message, "error");
      
      // Usuń parametr error z URL
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast]);

  return null;
}

