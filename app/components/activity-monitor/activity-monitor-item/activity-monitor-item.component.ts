import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from "@angular/core";
import { Activity, ActivityStatus } from "@batch-flask/ui/activity-monitor";
import { BehaviorSubject, Subscription } from "rxjs";

import "./activity-monitor-item.scss";

@Component({
    selector: "bl-activity-monitor-item",
    templateUrl: "activity-monitor-item.html",
})
export class ActivityMonitorItemComponent implements OnInit, OnChanges, OnDestroy {
    @Input() public activity: Activity;
    @Input() public selectSubject: BehaviorSubject<number>;
    @Input() public keyDownSubject: BehaviorSubject<KeyboardEvent>;
    @Input() public siblings: Activity[];
    @Input() public indent: number = 0;
    @Input() public hovering: boolean = false;
    @Output() public focusParent = new EventEmitter<void>();

    public statusOptions = ActivityStatus;
    public showSubactivities: boolean;

    private _status: ActivityStatus;
    private _selectedId: number;
    private _sub: Subscription;

    constructor() {
        this._status = null;
    }

    /* Angular Life Cycle Functions*/

    public ngOnInit() {
        this._sub = this.activity.statusSubject.subscribe(status => {
            this._status = status;
        });
        this._sub.add(this.selectSubject.subscribe(id => {
            this._selectedId = id;
        }));
        this._sub.add(this.keyDownSubject.subscribe(event => {
            if (event && this.selected) {
                this._handleKeyDown(event);
            }
        }));
    }

    public ngOnChanges(changes) {
        if (changes.indent) {
            this.indent = changes.indent.currentValue;
        }
        if (changes.hovering) {
            this.hovering = changes.hovering.currentValue;
        }
    }

    public ngOnDestroy() {
        this._sub.unsubscribe();
    }

    /* Template Getters */

    public get subactivities() {
        return this.activity.subactivities;
    }

    public get status() {
        return this._status;
    }

    public get finished() {
        return this._status === ActivityStatus.Completed ||
            this.status === ActivityStatus.Failed ||
            this.status === ActivityStatus.Canceled;
    }

    public get selected() {
        return this.activity.id === this._selectedId;
    }

    public trackByFn(index, activity: Activity) {
        return activity.id;
    }

    public getIndent() {
        return (this.indent * 30) + "px";
    }

    /* Change-of-state Functions */

    public toggleExpand() {
        if (this.subactivities.length === 0) { return; }

        this.showSubactivities = !this.showSubactivities;
        if (this.showSubactivities) {
            this._expand();
        } else {
            this._collapse();
        }
    }

    public hover() {
        this.hovering = true;
    }

    public unhover() {
        this.hovering = false;
    }

    /* Event Emitters */

    public select(id: number = this.activity.id) {
        // TODO look for cleaner way to handle propagation issue
        setTimeout(() => this.selectSubject.next(id), 10);
    }

    /* Private Helper Methods */

    private _handleKeyDown(event: KeyboardEvent) {
        switch (event.keyCode) {
            case 37:                // left arrow
                if (!this.showSubactivities) {
                    this._focusParent();
                } else {
                    this._collapse();
                }
                break;
            case 39:                // right arrow
                if (this.showSubactivities) {
                    this._focusChild();
                } else {
                    this._expand();
                }
                break;
            case 38:                // up arrow
                this._focusPrev();
                break;
            case 40:                // down arrow
                this._focusNext();
                break;
            case 13:                // Enter key
                this.toggleExpand();
                break;
            default:
                break;
        }
    }

    private _expand() {
        if (this.subactivities.length === 0) { return; }
        this.showSubactivities = true;
    }

    private _collapse() {
        this.showSubactivities = false;
    }

    private _focusPrev() {
        const sibIds = this.siblings.map(act => act.id);
        const index = sibIds.indexOf(this.activity.id);
        if (index === 0) { return; }

        this.select(sibIds[index - 1]);
    }

    private _focusNext() {
        const sibIds = this.siblings.map(act => act.id);
        const index = sibIds.indexOf(this.activity.id);
        if (index === sibIds.length - 1) { return; }

        this.select(sibIds[index + 1]);
    }

    private _focusParent() {
        this.focusParent.emit();
    }

    private _focusChild() {
        if (this.subactivities.length > 0) {
            this.select(this.subactivities[0].id);
        }
    }
}
