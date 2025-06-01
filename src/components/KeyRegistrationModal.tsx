
// src/components/KeyRegistrationModal.tsx
'use client';

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
import { Loader2, Download, KeyRound } from 'lucide-react';

interface KeyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterKey: (key: string) => void;
  productName: string;
  isLoading: boolean;
  retrievalModalData?: {
    intro_text?: string | null;
    antivirus_text?: string | null;
    antivirus_link_text?: string | null;
    antivirus_link_url?: string | null;
    launcher_text?: string | null;
    launcher_link_text?: string | null;
    launcher_link_url?: string | null;
    key_paste_text?: string | null;
    support_text?: string | null;
    support_link_text?: string | null;
    support_link_url?: string | null;
    how_to_run_link?: string | null;
  };
  activationType?: 'key_request' | 'info_modal' | 'direct_key';
  loaderDownloadUrl?: string | null; 
  infoModalContentHtml?: string | null; 
  infoModalSupportLinkText?: string | null;
  infoModalSupportLinkUrl?: string | null;
}

const KeyRegistrationModal: React.FC<KeyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterKey,
  productName,
  isLoading,
  retrievalModalData, 
  activationType,
  loaderDownloadUrl,
  infoModalContentHtml,
  infoModalSupportLinkText,
  infoModalSupportLinkUrl
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

  const defaultRetrievalData = {
    intro_text: `Спасибо что приобрели софт ${productName}. Для активации лицензии, необходимо выполнить ряд небольших действий.`,
    antivirus_text: "Перед загрузкой убедитесь что у вас отсутствует Антивирусник и отключен пункт Безопасность Windows.",
    antivirus_link_text: "Как отключить?",
    antivirus_link_url: "https://support.microsoft.com/ru-ru/windows/turn-off-defender-antivirus-protection-in-windows-security-99e6004f-c54c-8509-773c-a4d776b77960",
    launcher_text: `Скачайте лаунчер ${productName} и запустите от имени Администратора. При первом запуске, вы получите ошибку об отсутсвие лицензии. В буфер обмена будет скопирован ваш ключ.`,
    launcher_link_text: "Скачать лаунчер",
    key_paste_text: "Введите ваш ключ (Сочетание клавиш Ctrl+V) и нажмите кнопку \"Запросить активацию ключа\" ниже.",
    support_text: "В течение 10-15 минут, перезапустите Лаунчер. В случае отсутствия лицензии, просьба написать в Техническую поддержку",
    support_link_text: "@Gallant_kz",
    support_link_url: "https://t.me/gallant_kz",
  };

  const data = retrievalModalData || defaultRetrievalData;

  if (activationType === 'key_request') {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-card border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-primary">
              Активация лицензии для: {productName}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-2 text-sm text-muted-foreground space-y-3"> {/* Wrapper div */}
                <div>{data.intro_text || defaultRetrievalData.intro_text}</div>
                <div>
                  {data.antivirus_text || defaultRetrievalData.antivirus_text}
                  {(data.antivirus_link_url || defaultRetrievalData.antivirus_link_url) && (data.antivirus_link_url || defaultRetrievalData.antivirus_link_url) !== "#" && (
                    <Button variant="link" size="sm" className="p-0 h-auto ml-1 text-primary" asChild>
                      <a href={data.antivirus_link_url || defaultRetrievalData.antivirus_link_url} target="_blank" rel="noopener noreferrer">
                        {data.antivirus_link_text || defaultRetrievalData.antivirus_link_text}
                      </a>
                    </Button>
                  )}
                </div>
                <div>
                  {data.launcher_text || defaultRetrievalData.launcher_text}
                  {loaderDownloadUrl && loaderDownloadUrl !== "#" && (
                    <Button variant="secondary" size="sm" className="ml-2 mt-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30" asChild>
                      <a href={loaderDownloadUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> {data.launcher_link_text || defaultRetrievalData.launcher_link_text}
                      </a>
                    </Button>
                  )}
                </div>
                <div>{data.key_paste_text || defaultRetrievalData.key_paste_text}</div>
                <div>
                  {data.support_text || defaultRetrievalData.support_text}{' '}
                  {(data.support_link_url || defaultRetrievalData.support_link_url) && (data.support_link_url || defaultRetrievalData.support_link_url) !== "#" ? (
                    <a href={data.support_link_url || defaultRetrievalData.support_link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {data.support_link_text || defaultRetrievalData.support_link_text}
                    </a>
                  ) : (
                    data.support_link_text || defaultRetrievalData.support_link_text
                  )}
                  .
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="activation-key-input" className="text-sm font-medium text-foreground">
              Ваш ключ активации:
            </Label>
            <Input
              id="activation-key-input"
              placeholder="Введите или вставьте ваш ключ (Ctrl+V)"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
              disabled={isLoading}
              className="text-sm bg-input border-border"
            />
          </div>

          <AlertDialogFooter className="mt-4 pt-4 border-t border-border/30">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button onClick={handleRegister} disabled={isLoading || !activationKey.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <KeyRound className="mr-2 h-4 w-4"/> Запросить активацию
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  } else if (activationType === 'info_modal') {
      return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-card border-border shadow-xl">
                 <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-semibold text-primary">
                        Инструкция для: {productName}
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto prose prose-sm dark:prose-invert text-muted-foreground"
                     dangerouslySetInnerHTML={{ __html: infoModalContentHtml || '<p>Инструкция по этому товару будет добавлена позже. Обратитесь в поддержку.</p>' }}
                />
                <AlertDialogFooter className="mt-4 pt-4 border-t border-border/30">
                     {(infoModalSupportLinkUrl && infoModalSupportLinkUrl !== "#") && (
                        <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                            <a href={infoModalSupportLinkUrl} target="_blank" rel="noopener noreferrer">
                                {infoModalSupportLinkText || "Поддержка"}
                            </a>
                        </Button>
                    )}
                    <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-primary-foreground">Закрыть</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      );
  }
  
  return (
     <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Информация</AlertDialogTitle>
                <AlertDialogDescription>Тип активации для этого продукта не настроен.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button onClick={onClose}>OK</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
  );
};

export default KeyRegistrationModal;
    
