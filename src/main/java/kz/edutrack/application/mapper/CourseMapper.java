package kz.edutrack.application.mapper;

import kz.edutrack.application.dto.CourseDto;
import kz.edutrack.application.dto.CourseModuleDto;
import kz.edutrack.application.dto.MaterialDto;
import kz.edutrack.application.dto.TopicDto;
import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Material;
import kz.edutrack.domain.model.course.Topic;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface CourseMapper {
    CourseDto toDto(Course course);
    CourseModuleDto toDto(CourseModule module);
    TopicDto toDto(Topic topic);

    @Mapping(target = "publicUrl", source = "publicUrl")
    MaterialDto toDto(Material material);
}
