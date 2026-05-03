package kz.edutrack.application.mapper;

import kz.edutrack.application.dto.GradeDto;
import kz.edutrack.application.dto.SubmissionDto;
import kz.edutrack.domain.model.submission.Grade;
import kz.edutrack.domain.model.submission.Submission;
import org.mapstruct.Mapper;

@Mapper
public interface SubmissionMapper {
    SubmissionDto toDto(Submission submission);
    GradeDto toDto(Grade grade);
}
