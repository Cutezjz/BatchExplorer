import { Injectable, Injector } from "@angular/core";
import { autobind } from "@batch-flask/core";
import { DialogService, EntityCommand } from "@batch-flask/ui";

import { Job, JobState } from "app/models";
import { JobService } from "app/services";
import { DisableJobDialogComponent } from "./disable-job-dialog.component";

@Injectable()
export class DisableJobCommand extends EntityCommand<Job, string> {
    constructor(injector: Injector, jobService: JobService, private dialog: DialogService) {
        super(injector, {
            label: "Disable",
            action: (job: Job, option: string) => jobService.disable(job.id, option),
            enabled: (job) => job.state !== JobState.completed && job.state !== JobState.disabled,
            confirm: (x) => this._confirmAndGetInfo(x),
        });
    }

    @autobind()
    private _confirmAndGetInfo(entities: Job[]) {
        const dialogRef = this.dialog.open(DisableJobDialogComponent);
        dialogRef.componentInstance.jobs = entities;
        return dialogRef.componentInstance.onSubmit;
    }
}