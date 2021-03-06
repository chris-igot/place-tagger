import { type } from "os";
import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    Unique,
} from "typeorm";
import { voteInterval } from "../config";
import Place from "./Place";
import Tag from "./Tag";
import Vote from "./Vote";

export type VoteCountType = { for: number; against: number; neutral: number };

@Entity({ name: "tagRefs" })
@Unique(["placeId", "tagName"])
export default class TagRef {
    @PrimaryColumn()
    placeId: string;

    @PrimaryColumn()
    tagName: string;

    @ManyToOne(() => Place, (place) => place.tagRefs)
    @JoinColumn({ name: "placeId" })
    place: Place;

    @ManyToOne(() => Tag, (tag) => tag.tagRefs)
    @JoinColumn({ name: "tagName" })
    tag: Tag;

    @OneToMany(() => Vote, (vote) => vote.tagRef)
    votes: Vote[];

    voteCounts: VoteCountType;

    canVote: boolean;

    get voteCount() {
        let result: VoteCountType | null;

        if (this.votes) {
            result = { for: 0, against: 0, neutral: 0 };
            for (let i = 0; i < this.votes.length; i++) {
                const vote = this.votes[i];

                switch (vote.value) {
                    case 1:
                        ++result.for;
                        break;
                    case -1:
                        ++result.against;
                        break;
                    case 0:
                        ++result.neutral;
                        break;
                }
            }
        }

        return result;
    }

    checkVote(userId: string) {
        if (this.votes && this.votes.length > 0) {
            for (let i = 0; i < this.votes.length; i++) {
                const vote = this.votes[i];
                console.log(this.canVote);

                if (vote.userId === userId) {
                    const now = new Date();
                    const offsetTZMs = now.getTimezoneOffset() * 60000;
                    this.canVote =
                        now.valueOf() - vote.createdAt.valueOf() + offsetTZMs >=
                        voteInterval;
                }
            }
        } else {
            this.canVote = true;
        }
    }

    toJSON() {
        let obj = this;

        this.voteCounts = this.voteCount;
        delete obj.votes;
        delete obj.placeId;

        return obj;
    }
}
