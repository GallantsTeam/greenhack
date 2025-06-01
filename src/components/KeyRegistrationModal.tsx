import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface KeyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterKey: (key: string) => void; // Key will be passed to this function
  productName: string;
  isLoading: boolean;
  howToDisableLink?: string; // Optional: URL for "How to disable?"
  downloadLauncherLink?: string; // Optional: URL for "Download launcher"
  supportContact?: string; // Optional: Support contact info (e.g., @Gallant_kz)
  supportLink?: string; // Optional: URL for support contact
}

const KeyRegistrationModal: React.FC<KeyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterKey,
  productName,
  isLoading,
  howToDisableLink = "#", // Default placeholder
  downloadLauncherLink = "#", // Default placeholder
  supportContact = "@Gallant_kz", // Default placeholder
  supportLink = "https://t.me/gallant_kz" // Default placeholder
}) => {
  const [activationKey, setActivationKey] = useState('');

  const handleRegister = () => {
    if (activationKey.trim()) {
      onRegisterKey(activationKey.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Активация лицензии для: {productName}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground space-y-3">
            <p>
              Здравствуйте! Спасибо что приобрели софт <strong>{productName}</strong>.
              Для активации лицензии, необходимо выполнить ряд небольших действий.
            </p>
            <p>
              Перед загрузкой убедитесь что у вас отсутствует Антивирусник и отключен пункт Безопасность Windows.
              {howToDisableLink && howToDisableLink !== "#" && (
                <Button variant="link" size="sm" className="p-0 h-auto ml-1" asChild>
                  <a href={howToDisableLink} target="_blank" rel="noopener noreferrer">
                    Как отключить?
                  </a>
                </Button>
              )}
            </p>
            <p>
              Скачайте лаунчер <strong>{productName}</strong> и запустите от имени Администратора.
              При первом запуске, вы получите ошибку об отсутсвие лицензии. В буфер обмена будет скопирован ваш ключ.
              {downloadLauncherLink && downloadLauncherLink !== "#" && (
                <Button variant="secondary" size="sm" className="ml-2" asChild>
                  <a href={downloadLauncherLink} target="_blank" rel="noopener noreferrer">
                    Скачать лаунчер
                  </a>
                </Button>
              )}
            </p>
            <p>
              Введите ваш ключ (Сочетание клавиш Ctrl+V) и нажмите кнопку "Регистрация ключа" ниже.
              В течение 10-15 минут, перезапустите Лаунчер. В случае отсутствия лицензии, просьба написать в Техническую поддержку{' '}
              {supportLink && supportLink !== "#" ? (
                <a href={supportLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {supportContact}
                </a>
              ) : (
                supportContact
              )}
              .
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-2">
          <Label htmlFor="activation-key-input" className="text-sm font-medium">
            Ваш ключ активации:
          </Label>
          <Input
            id="activation-key-input"
            placeholder="Введите или вставьте ваш ключ (Ctrl+V)"
            value={activationKey}
            onChange={(e) => setActivationKey(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
        </div>

        <AlertDialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button onClick={handleRegister} disabled={isLoading || !activationKey.trim()} className="bg-primary hover:bg-primary/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Регистрация ключа
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default KeyRegistrationModal;