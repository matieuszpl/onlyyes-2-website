import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertCircle, Server, FileQuestion } from "lucide-react";
import TextGlitch from "../components/TextGlitch";
import Card from "../components/Card";
import Button from "../components/Button";

const errorMessages = {
  404: {
    title: "404",
    message: "Nie znaleziono takiej strony",
    description: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
    icon: FileQuestion,
  },
  500: {
    title: "500",
    message: "Błąd serwera",
    description: "Wystąpił błąd po stronie serwera. Spróbuj ponownie później.",
    icon: Server,
  },
  default: {
    title: "Błąd",
    message: "Coś poszło nie tak",
    description: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
    icon: AlertCircle,
  },
};

export default function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const status = location.state?.status || 404;
  const errorInfo = errorMessages[status] || errorMessages.default;
  const Icon = errorInfo.icon;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Card padding="p-8 md:p-12" className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-magenta rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-primary/20 rounded-full border-2 border-primary/40"
            >
              <Icon className="text-primary" size={64} />
            </motion.div>

            <div className="space-y-4 w-full">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-header text-7xl md:text-9xl text-primary leading-none text-center w-full flex justify-center"
              >
                <TextGlitch
                  text={errorInfo.title}
                  altTexts={[
                    errorInfo.title,
                    errorInfo.title.replace(/[0-9]/g, (d) => "０１２３４５６７８９"[d]),
                    errorInfo.title.split("").reverse().join(""),
                  ]}
                />
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-header text-2xl md:text-3xl text-primary uppercase tracking-wider"
              >
                {errorInfo.message}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-mono text-sm md:text-base text-text-secondary max-w-md mx-auto"
              >
                {errorInfo.description}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <Button
                onClick={() => navigate("/")}
                variant="primary"
                size="lg"
                className="flex items-center gap-2 bg-primary text-bg-primary"
              >
                <Home size={20} />
                Wróć do strony głównej
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

