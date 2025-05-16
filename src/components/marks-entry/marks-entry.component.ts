import { Component, OnDestroy, OnInit, PLATFORM_ID, Inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { VoiceRecorderService } from '../voice-recorder.service';

interface Student {
  rollNo: number;
  name: string;
  marks: number | null;
} 

@Component({
  selector: 'app-marks-entry',
  imports: [CommonModule, FormsModule],
  templateUrl: './marks-entry.component.html',
  styleUrl: './marks-entry.component.scss'
})
export class MarksEntryComponent implements OnInit, OnDestroy {
  students: Student[] = [];
  isListening = false;
  transcript = '';
  recognition: any;
  lastUpdatedRoll: number | null = null;
  isBrowser: boolean;
  isSpeechRecognitionSupported = false;
  processingStatus = '';
  batchMode = false;
  animationFrameId: number | null = null;
  pendingUpdates: {rollNo: number, marks: number}[] = [];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Initialize sample student data
    this.students = Array(20).fill(0).map((_, i) => ({
      rollNo: i + 1,
      name: `Student ${i + 1}`,
      marks: null
    }));
  }

  ngOnInit(): void {
    // Initialize speech recognition only in the browser
    if (this.isBrowser) {
      this.initializeSpeechRecognition();
    }
  }

  ngOnDestroy(): void {
    // Stop recognition when component is destroyed
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }

    // Cancel any pending animation frames
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  initializeSpeechRecognition(): void {
    // Check if speech recognition is available in the browser
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.isSpeechRecognitionSupported = true;
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            // Use Angular's zone to ensure UI updates
            this.zone.run(() => {
              this.processVoiceInput(finalTranscript);
            });
          } else {
            this.zone.run(() => {
              this.transcript = event.results[i][0].transcript;
            });
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
    }
  }

  toggleVoiceRecognition(): void {
    if (!this.isBrowser || !this.isSpeechRecognitionSupported) {
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.transcript = '';
    } else {
      this.recognition.start();
      this.isListening = true;
    }
  }

  processVoiceInput(input: string): void {
    console.log('Processing voice input:', input);
    this.transcript = input;
    
    // Array of recognized patterns
    const patterns = [
      // Pattern for multiple entries: "Roll numbers 5 marks 85, 6 marks 90, 7 marks 78"
      {
        regex: /roll (?:numbers|number|no\.?s?|#)?\s*((?:\d+\s*(?:marks|mark|got|has|scores?|points|grade)\s*\d+(?:\s*,\s*|\s+and\s+|\s+then\s+|\s+))*\d+\s*(?:marks|mark|got|has|scores?|points|grade)\s*\d+)/i,
        process: (match: RegExpMatchArray) => {
          const entriesText = match[1];
          
          // Extract roll numbers and marks from the text
          const entriesRegex = /(\d+)\s*(?:marks|mark|got|has|scores?|points|grade)\s*(\d+)/gi;
          let entryMatch;
          const entries: {rollNo: number, marks: number}[] = [];
          
          while ((entryMatch = entriesRegex.exec(entriesText)) !== null) {
            const rollNo = parseInt(entryMatch[1], 10);
            const marks = parseInt(entryMatch[2], 10);
            
            if (!isNaN(rollNo) && !isNaN(marks)) {
              entries.push({ rollNo, marks });
            }
          }
          
          return entries;
        }
      },
      // Individual pattern: "Roll number 5, marks 85"
      {
        regex: /roll (?:number|no\.?|#)?\s*(\d+)(?:\s*,)?\s*(?:marks|mark|got|has|scores?|points|grade)\s*(\d+)/i,
        process: (match: RegExpMatchArray) => {
          const rollNo = parseInt(match[1], 10);
          const marks = parseInt(match[2], 10);
          
          if (!isNaN(rollNo) && !isNaN(marks)) {
            return [{ rollNo, marks }];
          }
          return [];
        }
      }
    ];
    
    let processedEntries: {rollNo: number, marks: number}[] = [];
    
    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const match = input.match(pattern.regex);
      if (match) {
        processedEntries = pattern.process(match);
        if (processedEntries.length > 0) {
          break;
        }
      }
    }
    
    // Update student marks with the processed entries
    if (processedEntries.length > 0) {
      // Add new entries to pending updates
      this.pendingUpdates = [...this.pendingUpdates, ...processedEntries];
      
      // Set status message
      if (processedEntries.length === 1) {
        this.processingStatus = `Updating roll number ${processedEntries[0].rollNo}`;
      } else {
        this.processingStatus = `Updating ${processedEntries.length} students`;
      }
      
      // Process updates using requestAnimationFrame for smooth UI updates
      if (this.animationFrameId === null) {
        this.processUpdatesQueue();
      }
    }
  }
  
  processUpdatesQueue(): void {
    // Process updates in batches for better UI performance
    if (this.pendingUpdates.length > 0) {
      const batchSize = 3; // Process a few entries at a time
      const batch = this.pendingUpdates.splice(0, batchSize);
      
      batch.forEach(entry => {
        const student = this.students.find(s => s.rollNo === entry.rollNo);
        if (student) {
          student.marks = entry.marks;
          this.lastUpdatedRoll = entry.rollNo;
        }
      });
      
      // Force change detection to update UI
      this.cdr.detectChanges();
      
      // If there are more updates, schedule next batch
      if (this.pendingUpdates.length > 0) {
        this.animationFrameId = requestAnimationFrame(() => {
          this.animationFrameId = null;
          this.processUpdatesQueue();
        });
      } else {
        // Clear highlight after all updates are processed
        setTimeout(() => {
          this.lastUpdatedRoll = null;
          this.processingStatus = 'All updates completed';
          this.cdr.detectChanges();
          
          // Clear status message after a delay
          setTimeout(() => {
            this.processingStatus = '';
            this.cdr.detectChanges();
          }, 2000);
        }, 1000);
      }
    }
  }

  saveMarks(): void {
    // Here you would typically send the data to a backend API
    console.log('Saving marks:', this.students);
    alert('Marks saved successfully!');
  }
}
